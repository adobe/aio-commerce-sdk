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

import { commerceEventsPhase, externalEventsPhase } from "../events";
import { webhooksPhase } from "../webhooks";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyPhase, InstallationContext, StepDeclaration } from "./phase";
import type {
  InstallationError,
  InstallationPlan,
  InstallationState,
  InstallationStateStore,
  PhaseStatus,
} from "./types";

/** Options for creating an installation plan. */
export type CreatePlanOptions = {
  /** The app configuration used to determine applicable phases/steps. */
  config: CommerceAppConfigOutputModel;

  /** Additional phases to include beyond the built-in ones. */
  extraPhases?: AnyPhase[];
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
  extraPhases?: AnyPhase[];

  /** State store for persisting installation progress. */
  store: InstallationStateStore;
};

/** The phases built-in in the library. */
const DEFAULT_PHASES: AnyPhase[] = [
  commerceEventsPhase,
  externalEventsPhase,
  webhooksPhase,
];

/** Builds a phase registry map from phase name to phase definition. */
function buildPhaseRegistry(
  extraPhases: AnyPhase[] = [],
): Map<string, AnyPhase> {
  const allPhases = [...DEFAULT_PHASES, ...extraPhases];
  return new Map(allPhases.map((phase) => [phase.name, phase]));
}

/** Creates an installation plan from the config and phase definitions. */
export function createInstallationPlan(
  options: CreatePlanOptions,
): InstallationPlan {
  const { config, extraPhases = [] } = options;
  const phases = [...DEFAULT_PHASES, ...extraPhases];
  const applicablePhases = phases.filter((phase) => phase.when(config));

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    phases: applicablePhases.map((phase) => {
      const stepEntries = Object.entries(phase.steps) as [
        string,
        StepDeclaration,
      ][];
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

/** Creates the initial installation state from a plan. */
function createInitialState(plan: InstallationPlan): InstallationState {
  return {
    installationId: plan.id,
    startedAt: new Date().toISOString(),
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

function createStepRunner(
  phaseName: string,
  phaseStatus: PhaseStatus,
  state: InstallationState,
  store: InstallationStateStore,
) {
  return async <T>(stepName: string, fn: () => T | Promise<T>): Promise<T> => {
    const stepStatus = phaseStatus.steps.find((s) => s.name === stepName);

    if (!stepStatus) {
      return fn();
    }

    stepStatus.status = "in-progress";
    await store.save(state);

    try {
      const result = await fn();

      stepStatus.status = "succeeded";
      state.data[stepName] = result as Record<string, unknown>;
      await store.save(state);

      return result;
    } catch (error) {
      stepStatus.status = "failed";
      phaseStatus.status = "failed";
      state.error = {
        phase: phaseName,
        step: stepName,
        key: "STEP_EXECUTION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };

      await store.save(state);
      throw error;
    }
  };
}

async function runPhase(
  phase: AnyPhase,
  installationContext: InstallationContext,
  config: CommerceAppConfigOutputModel,
  state: InstallationState,
  store: InstallationStateStore,
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
  await store.save(state);

  const run = createStepRunner(phase.name, phaseStatus, state, store);
  try {
    await phase.run({
      installationContext,
      config,
      phaseContext,
      run,
    });

    phaseStatus.status = "succeeded";
    await store.save(state);

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
    await store.save(state);

    return state.error;
  }
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
    store,
  } = options;
  const phaseRegistry = buildPhaseRegistry(extraPhases);
  const state = createInitialState(plan);
  await store.save(state);

  // Run phases sequentially to avoid race conditions on state writes
  for (const plannedPhase of plan.phases) {
    const phase = phaseRegistry.get(plannedPhase.name);
    if (!phase) {
      state.status = "failed";
      state.error = {
        phase: plannedPhase.name,
        step: "",
        key: "PHASE_NOT_IN_REGISTRY",
        message: `Phase "${plannedPhase.name}" not found in registry. Did you forget to pass it in extraPhases?`,
      };

      state.completedAt = new Date().toISOString();
      await store.save(state);
      return state;
    }

    const error = await runPhase(
      phase,
      installationContext,
      config,
      state,
      store,
    );

    if (error) {
      state.status = "failed";
      state.error = error;
      state.completedAt = new Date().toISOString();
      await store.save(state);
      return state;
    }
  }

  state.status = "succeeded";
  state.completedAt = new Date().toISOString();
  await store.save(state);

  return state;
}
