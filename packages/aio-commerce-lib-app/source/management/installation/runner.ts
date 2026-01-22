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

import { findPhaseDefinition } from "./phases";

import type { SimplifyDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyPhaseDefinition } from "./phases";
import type { InstallationPlan, PlannedPhase } from "./plan";
import type {
  DataBefore,
  GenericPhaseDef,
  InstallationContext,
  StepContext,
} from "./types";

type StepExecutionResult =
  | { success: true; data: unknown }
  | { success: false; error: { key: string; [k: string]: unknown } };

type PhaseExecutionResult =
  | { success: true }
  | { success: false; step: string; error: unknown };

export type InstallationResult =
  | { status: "succeeded" }
  | { status: "failed"; phase: string; step: string; error: unknown };

function stepFailed(
  key: string,
  errorPayload?: Record<string, unknown>,
): StepExecutionResult {
  return { success: false, error: { key, ...errorPayload } };
}

function phaseSuccess(): PhaseExecutionResult {
  return { success: true };
}

function phaseFailed(step: string, error: unknown): PhaseExecutionResult {
  return { success: false, step, error };
}

function installationSuccess(): InstallationResult {
  return { status: "succeeded" };
}

function installationFailed(
  phase: string,
  step: string,
  error: unknown,
): InstallationResult {
  return { status: "failed", phase, step, error };
}

/**
 * Executes an installation plan.
 * @param plan - The installation plan to execute.
 * @param config - The commerce app configuration.
 * @param context - The installation context.
 */
export async function executeInstallation(
  plan: InstallationPlan,
  config: CommerceAppConfigOutputModel,
  context: InstallationContext,
) {
  for (const plannedPhase of plan.phases) {
    const definition = findPhaseDefinition(plannedPhase.name);
    if (!definition) {
      return installationFailed(
        plannedPhase.name,
        "before-install",
        new Error(`Unknown phase: ${plannedPhase.name}`),
      );
    }

    const result = await executePhase(
      definition,
      plannedPhase,
      config,
      context,
    );

    if (!result.success) {
      return installationFailed(plannedPhase.name, result.step, result.error);
    }
  }

  return installationSuccess();
}

async function executePhase(
  definition: AnyPhaseDefinition,
  plannedPhase: PlannedPhase,
  config: CommerceAppConfigOutputModel,
  context: InstallationContext,
): Promise<PhaseExecutionResult> {
  const phaseContext = definition.createPhaseContext
    ? await definition.createPhaseContext(context)
    : {};

  const plannedStepNames = new Set(plannedPhase.steps.map((s) => s.name));
  let accumulated = {};

  for (const stepName of definition.order) {
    if (!plannedStepNames.has(stepName)) {
      continue;
    }

    const result = await executeStep(
      definition,
      stepName,
      accumulated,
      phaseContext,
      config,
      context,
    );

    if (result.success) {
      if (typeof result.data === "object" && result.data !== null) {
        accumulated = { ...accumulated, ...result.data };
      }
    } else {
      return phaseFailed(stepName, result.error);
    }
  }

  return phaseSuccess();
}

async function executeStep(
  definition: AnyPhaseDefinition,
  stepName: string,
  accumulated: Record<string, unknown>,
  phaseContext: unknown,
  config: CommerceAppConfigOutputModel,
  context: InstallationContext,
) {
  // Shorthand as at this point we don't care about type-safety.
  type GenericExecutor = (
    c: CommerceAppConfigOutputModel,
    ctx: StepContext<GenericPhaseDef, string, unknown>,
  ) => Promise<StepExecutionResult> | StepExecutionResult;

  const executors = definition.executors as unknown as Record<
    string,
    GenericExecutor
  >;
  const executor = executors[stepName];

  if (!executor) {
    return stepFailed("UNEXPECTED_ERROR", {
      error: new Error(`Unknown step: ${stepName}`),
    });
  }

  const data = accumulated as SimplifyDeep<
    DataBefore<
      GenericPhaseDef["order"],
      GenericPhaseDef["steps"],
      typeof stepName
    >
  >;

  const stepContext: StepContext<GenericPhaseDef, string, unknown> = {
    phase: definition.name,
    step: stepName,
    installationContext: context,
    phaseContext,
    data,
    helpers: {
      stepSuccess: (stepData) => ({ success: true, data: stepData }),
      stepFailed: (key, errorPayload) => ({
        success: false,
        error: { key, ...errorPayload },
      }),
    },
  };

  try {
    return await executor(config, stepContext);
  } catch (error) {
    return stepFailed("UNEXPECTED_ERROR", {
      error: new Error("An unexpected error occurred", { cause: error }),
    });
  }
}
