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

import { eventsPhase } from "../events";
import { webhooksPhase } from "../webhooks";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyStep, InstallationContext, Phase } from "./phase";
import type {
  InstallationError,
  InstallationPlan,
  InstallationState,
  InstallationStateStore,
} from "./types";

// biome-ignore lint/suspicious/noExplicitAny: Phase/Step generics are complex, using any for flexibility
type AnyPhase = Phase<string, any, any, any, any>;

/** Result of a step execution. */
type StepResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: InstallationError };

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
const DEFAULT_PHASES: AnyPhase[] = [eventsPhase, webhooksPhase];

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
    phases: applicablePhases.map((phase) => ({
      name: phase.name,
      meta: phase.meta,
      steps: phase.steps
        .filter((step: AnyStep) => !step.when || step.when(config))
        .map((step: AnyStep) => ({ name: step.name, meta: step.meta })),
    })),
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

/** Runs a single step and returns the result. */
async function runStep(
  step: AnyStep,
  phaseName: string,
  installationContext: InstallationContext,
  config: CommerceAppConfigOutputModel,
  phaseCtx: unknown,
  phaseData: Record<string, unknown>,
): Promise<StepResult<unknown>> {
  let stepError: InstallationError | undefined;

  const fail = (key: string, ...args: unknown[]): never => {
    const hasPayload = args.length > 0 && typeof args[0] === "object";
    const payload = hasPayload ? args[0] : undefined;
    stepError = { phase: phaseName, step: step.name, key, payload };

    // Throw to exit the step.run() execution, but we'll catch it
    throw stepError;
  };

  try {
    const output = await step.run({
      installationContext,
      config,
      phaseContext: phaseCtx,
      data: phaseData,
      fail,
    });
    return { ok: true, data: output };
  } catch (err) {
    // If it's our controlled error from fail(), return it
    if (stepError !== undefined) {
      return { ok: false, error: stepError };
    }

    return {
      ok: false,
      error: {
        phase: phaseName,
        step: step.name,
        key: "UNEXPECTED_ERROR",
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/** Runs a single phase. Returns error if any step fails. */
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

  const phaseCtx = phase.context
    ? await phase.context(installationContext)
    : {};

  const phaseData: Record<string, unknown> = {};
  phaseStatus.status = "in-progress";
  await store.save(state);

  for (const step of phase.steps) {
    const stepStatus = phaseStatus.steps.find(
      (phaseStep) => phaseStep.name === step.name,
    );

    if (!stepStatus) {
      continue; // Step was filtered out by condition
    }

    stepStatus.status = "in-progress";
    await store.save(state);

    const result = await runStep(
      step,
      phase.name,
      installationContext,
      config,
      phaseCtx,
      phaseData,
    );

    if (!result.ok) {
      stepStatus.status = "failed";
      phaseStatus.status = "failed";
      await store.save(state);

      return result.error;
    }

    phaseData[step.name] = result.data;
    state.data[step.name] = result.data as Record<string, unknown>;
    stepStatus.status = "succeeded";

    await store.save(state);
  }

  phaseStatus.status = "succeeded";
  await store.save(state);

  return null;
}

/** Runs the full installation workflow. Returns the final state (never throws). */
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
