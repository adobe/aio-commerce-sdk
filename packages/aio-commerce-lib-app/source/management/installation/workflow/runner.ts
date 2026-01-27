/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { callHook } from "./hooks";
import { buildPhaseRegistry, DEFAULT_PHASES } from "./registry";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationHooks } from "./hooks";
import type { InstallationContext, Phase, StepDeclaration } from "./phase";
import type {
  InstallationError,
  InstallationPlan,
  InstallationState,
  PhaseStatus,
} from "./types";

/** Options for creating an installation plan. */
export type CreatePlanOptions = {
  /** The app configuration used to determine applicable phases/steps. */
  config: CommerceAppConfigOutputModel;

  /** Additional phases to include beyond the built-in ones. */
  extraPhases?: Phase[];
};

/** Options for running an installation. */
export type RunnerOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The pre-created installation plan to execute. */
  plan: InstallationPlan;

  /** Additional phases to include beyond the built-in ones. */
  extraPhases?: Phase[];

  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/** Returns the current time as an ISO string. */
function nowIsoString() {
  return new Date().toISOString();
}

/**
 * Creates an installation plan from the config and phase definitions.
 * @param options The options for creating the installation plan.
 */
export function createInstallationPlan(
  options: CreatePlanOptions,
): InstallationPlan {
  const { config, extraPhases = [] } = options;
  const phases = [...DEFAULT_PHASES, ...extraPhases];
  const applicablePhases = phases.filter((phase) => phase.when(config));

  return {
    id: crypto.randomUUID(),
    createdAt: nowIsoString(),

    phases: applicablePhases.map((phase) => {
      const stepEntries: [string, StepDeclaration][] = Object.entries(
        phase.steps,
      );

      const applicableSteps = stepEntries.filter(
        ([_, step]) => !step.when || step.when(config),
      );

      return {
        name: phase.name,
        meta: phase.meta,
        steps: applicableSteps.map(([name, step]) => ({
          name,
          meta: { label: step.label, description: step.description },
        })),
      };
    }),
  };
}

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 * @param options The options for the installation workflow.
 */
export async function runInstallation(
  options: RunnerOptions,
): Promise<InstallationState> {
  const {
    installationContext,
    config,
    plan,
    extraPhases = [],
    hooks,
  } = options;

  const phaseRegistry = buildPhaseRegistry(extraPhases);
  const state = createInitialState(plan);
  await callHook(hooks, "onInstallationStart", state);

  for (const plannedPhase of plan.phases) {
    const phase = phaseRegistry.get(plannedPhase.name);

    if (!phase) {
      state.completedAt = nowIsoString();
      state.status = "failed";
      state.error = {
        phase: plannedPhase.name,
        step: "",
        key: "PHASE_NOT_IN_REGISTRY",
        message: `Phase "${plannedPhase.name}" not found in registry. Did you forget to pass it in extraPhases?`,
      };

      await callHook(hooks, "onInstallationFailure", state);
      return state;
    }

    const error = await runPhase(
      phase as Phase,
      installationContext,
      config,
      state,
      hooks,
    );

    if (error) {
      state.completedAt = nowIsoString();
      state.status = "failed";
      state.error = error;

      await callHook(hooks, "onInstallationFailure", state);
      return state;
    }
  }

  state.status = "succeeded";
  state.completedAt = nowIsoString();

  await callHook(hooks, "onInstallationSuccess", state);
  return state;
}

/** Creates the initial installation state from a plan. */
function createInitialState(plan: InstallationPlan): InstallationState {
  return {
    installationId: plan.id,
    startedAt: nowIsoString(),
    status: "in-progress",

    phases: plan.phases.map((phase) => ({
      name: phase.name,
      status: "pending",
      steps: phase.steps.map((step) => ({
        name: step.name,
        status: "pending",
      })),
    })),

    data: {},
    error: null,
  };
}

/** Create a handler that will run a step of a phase. */
function createStepRunner(
  phaseName: string,
  phaseStatus: PhaseStatus,
  state: InstallationState,
  hooks: InstallationHooks = {},
) {
  return async <T>(stepName: string, fn: () => T | Promise<T>): Promise<T> => {
    const stepStatus = phaseStatus.steps.find((s) => s.name === stepName);

    if (!stepStatus) {
      // TODO: this needs to throw.
      return fn();
    }

    stepStatus.status = "in-progress";
    await callHook(hooks, "onStepStart", { phaseName, stepName }, state);

    try {
      const result = await fn();
      stepStatus.status = "succeeded";

      await callHook(
        hooks,
        "onStepSuccess",
        { phaseName, stepName, result },
        state,
      );

      return result;
    } catch (error) {
      stepStatus.status = "failed";
      state.error = {
        phase: phaseName,
        step: stepName,
        key: "STEP_EXECUTION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };

      await callHook(
        hooks,
        "onStepFailure",
        { phaseName, stepName, error: state.error },
        state,
      );

      throw error;
    }
  };
}

/** Runs a phase with automatic state management. */
async function runPhase(
  phase: Phase,
  installationContext: InstallationContext,
  config: CommerceAppConfigOutputModel,
  state: InstallationState,
  hooks: InstallationHooks = {},
): Promise<InstallationError | null> {
  const phaseStatus = state.phases.find((p) => p.name === phase.name);
  if (!phaseStatus) {
    return {
      phase: phase.name,
      step: "",
      key: "PHASE_NOT_FOUND",
      message: `Phase "${phase.name}" not found in state`,
    };
  }

  const phaseContext = phase.context
    ? await phase.context(installationContext)
    : {};

  phaseStatus.status = "in-progress";
  await callHook(hooks, "onPhaseStart", { phaseName: phase.name }, state);

  const run = createStepRunner(phase.name, phaseStatus, state, hooks);
  try {
    const result = await phase.run({
      run,
      context: {
        ...installationContext,
        ...phaseContext,
        config,
      },
    });

    phaseStatus.status = "succeeded";
    state.data[phase.name] = result;

    await callHook(
      hooks,
      "onPhaseSuccess",
      { phaseName: phase.name, result },
      state,
    );

    return null;
  } catch (error) {
    if (!state.error) {
      state.error = {
        phase: phase.name,
        step: "",
        key: "PHASE_EXECUTION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };
    }

    phaseStatus.status = "failed";
    await callHook(
      hooks,
      "onPhaseFailure",
      { phaseName: phase.name, error: state.error },
      state,
    );

    return state.error;
  }
}
