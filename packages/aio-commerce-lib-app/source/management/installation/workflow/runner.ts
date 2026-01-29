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
import { buildStepRegistry, DEFAULT_STEPS } from "./registry";
import { isBranchStep, isLeafStep } from "./step";
import { getAtPath, nowIsoString, setAtPath } from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationHooks } from "./hooks";
import type { AnyStep, InstallationContext } from "./step";
import type {
  FailedInstallationState,
  InProgressInstallationState,
  InstallationError,
  InstallationPlan,
  InstallationPlanStep,
  StepStatus,
  SucceededInstallationState,
} from "./types";

/** Options for creating an installation plan. */
export type CreatePlanOptions = {
  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;

  /** Additional root steps to include beyond the built-in ones. */
  extraSteps?: AnyStep[];
};

/** Options for running an installation. */
export type RunnerOptions = {
  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The pre-created installation plan to execute. */
  plan: InstallationPlan;

  /** Additional root steps to include beyond the built-in ones. */
  extraSteps?: AnyStep[];

  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/**
 * Creates an installation plan from the config and step definitions.
 * Filters steps based on their `when` conditions and builds a tree structure.
 */
export function createInstallationPlan(
  options: CreatePlanOptions,
): InstallationPlan {
  const { config, extraSteps = [] } = options;
  const rootSteps = [...DEFAULT_STEPS, ...extraSteps];

  return {
    id: crypto.randomUUID(),
    createdAt: nowIsoString(),
    steps: buildPlanSteps(rootSteps, config),
  };
}

/** Recursively builds plan steps, filtering by `when` conditions. */
function buildPlanSteps(
  steps: AnyStep[],
  config: CommerceAppConfigOutputModel,
): InstallationPlanStep[] {
  const planSteps: InstallationPlanStep[] = [];

  for (const step of steps) {
    // Check if step applies to this config
    if (step.when && !step.when(config)) {
      continue;
    }

    const planStep: InstallationPlanStep = {
      name: step.name,
      meta: step.meta,
      children: [],
    };

    // Recursively process children for branch steps
    if (isBranchStep(step)) {
      planStep.children = buildPlanSteps(step.children, config);
    }

    planSteps.push(planStep);
  }

  return planSteps;
}

/** Recursively builds initial step statuses from plan steps. */
function buildInitialStepStatuses(
  planSteps: InstallationPlanStep[],
  parentPath: string[],
): StepStatus[] {
  return planSteps.map((planStep) => {
    const path = [...parentPath, planStep.name];
    return {
      name: planStep.name,
      path,
      status: "pending" as const,
      children: buildInitialStepStatuses(planStep.children, path),
    };
  });
}

/** Type for the step registry map. */
type StepRegistry = Map<string, AnyStep>;

/** Mutable context passed through execution. */
type Execution = {
  readonly installationId: string;
  readonly startedAt: string;
  readonly steps: StepStatus[];
  readonly data: Record<string, unknown>;
  error: InstallationError | null;
};

/** Snapshot current execution as InProgressInstallationState. */
function snapshot(exec: Execution): InProgressInstallationState {
  return {
    installationId: exec.installationId,
    startedAt: exec.startedAt,
    status: "in-progress",
    steps: exec.steps,
    data: exec.data,
  };
}

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 */
export async function runInstallation(
  options: RunnerOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { installationContext, config, plan, extraSteps = [], hooks } = options;

  const exec: Execution = {
    installationId: plan.id,
    startedAt: nowIsoString(),
    steps: buildInitialStepStatuses(plan.steps, []),
    data: {},
    error: null,
  };

  const stepRegistry = buildStepRegistry(extraSteps);
  await callHook(hooks, "onInstallationStart", snapshot(exec));

  try {
    for (const stepStatus of exec.steps) {
      const step = stepRegistry.get(stepStatus.name);
      if (!step) {
        throw new Error(`Step "${stepStatus.name}" not found`);
      }
      await executeStep(step, stepStatus, installationContext, config, {}, exec, stepRegistry, hooks);
    }

    const succeeded: SucceededInstallationState = {
      installationId: exec.installationId,
      startedAt: exec.startedAt,
      status: "succeeded",
      completedAt: nowIsoString(),
      steps: exec.steps,
      data: exec.data,
    };
    await callHook(hooks, "onInstallationSuccess", succeeded);
    return succeeded;
  } catch (err) {
    const failed: FailedInstallationState = {
      installationId: exec.installationId,
      startedAt: exec.startedAt,
      status: "failed",
      completedAt: nowIsoString(),
      steps: exec.steps,
      data: exec.data,
      error: exec.error ?? {
        path: [],
        key: "INSTALLATION_FAILED",
        message: err instanceof Error ? err.message : String(err),
      },
    };
    await callHook(hooks, "onInstallationFailure", failed);
    return failed;
  }
}

async function executeStep(
  step: AnyStep,
  stepStatus: StepStatus,
  ctx: InstallationContext,
  config: CommerceAppConfigOutputModel,
  inherited: Record<string, unknown>,
  exec: Execution,
  registry: StepRegistry,
  hooks?: InstallationHooks,
): Promise<void> {
  const { path } = stepStatus;
  const isLeaf = isLeafStep(step);

  stepStatus.status = "in-progress";
  await callHook(hooks, "onStepStart", { path, stepName: step.name, isLeaf }, snapshot(exec));

  try {
    if (isBranchStep(step)) {
      let childCtx = inherited;
      if (step.context) {
        childCtx = { ...inherited, ...(await step.context(ctx)) };
      }
      for (const child of stepStatus.children) {
        const childStep = step.children.find((c) => c.name === child.name);
        if (!childStep) {
          throw new Error(`Step "${child.name}" not found`);
        }
        await executeStep(childStep, child, ctx, config, childCtx, exec, registry, hooks);
      }
    } else if (isLeafStep(step)) {
      const result = await step.run(config, { ...ctx, ...inherited });
      setAtPath(exec.data, path, result);
    }

    stepStatus.status = "succeeded";
    await callHook(hooks, "onStepSuccess", { path, stepName: step.name, isLeaf, result: getAtPath(exec.data, path) }, snapshot(exec));
  } catch (err) {
    stepStatus.status = "failed";
    exec.error ??= {
      path,
      key: "STEP_EXECUTION_FAILED",
      message: err instanceof Error ? err.message : String(err),
    };
    await callHook(hooks, "onStepFailure", { path, stepName: step.name, isLeaf, error: exec.error }, snapshot(exec));
    throw err;
  }
}
