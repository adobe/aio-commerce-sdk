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
import {
  createFailedState,
  createInstallationError,
  createSucceededState,
  getAtPath,
  nowIsoString,
  setAtPath,
} from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationHooks } from "./hooks";
import type {
  AnyStep,
  BranchStep,
  InstallationContext,
  LeafStep,
} from "./step";
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

/** Type for the step registry map. */
type StepRegistry = Map<string, AnyStep>;

/** Context for step execution containing all necessary dependencies. */
type StepExecutionContext = {
  installationContext: InstallationContext;
  config: CommerceAppConfigOutputModel;
  installationId: string;
  startedAt: string;
  steps: StepStatus[];
  data: Record<string, unknown>;
  error: InstallationError | null;
  registry: StepRegistry;
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

/**
 * Runs the full installation workflow. Returns the final state (never throws).
 */
export async function runInstallation(
  options: RunnerOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { installationContext, config, plan, extraSteps = [], hooks } = options;
  const context: StepExecutionContext = {
    installationContext,
    config,
    installationId: plan.id,
    startedAt: nowIsoString(),
    steps: buildInitialStepStatuses(plan.steps, []),
    data: {},
    error: null,
    registry: buildStepRegistry(extraSteps),
    hooks,
  };

  await callHook(hooks, "onInstallationStart", snapshot(context));

  try {
    for (const stepStatus of context.steps) {
      const step = context.registry.get(stepStatus.name);
      if (!step) {
        throw new Error(`Step "${stepStatus.name}" not found`);
      }

      await executeStep(step, stepStatus, {}, context);
    }

    const succeeded = createSucceededState(context);
    await callHook(hooks, "onInstallationSuccess", succeeded);

    return succeeded;
  } catch (err) {
    const error =
      context.error ?? createInstallationError(err, [], "INSTALLATION_FAILED");

    const failed = createFailedState(context, error);
    await callHook(hooks, "onInstallationFailure", failed);

    return failed;
  }
}

/** Recursively builds plan steps, filtering by `when` conditions. */
function buildPlanSteps(
  steps: AnyStep[],
  config: CommerceAppConfigOutputModel,
): InstallationPlanStep[] {
  const planSteps: InstallationPlanStep[] = [];

  for (const step of steps) {
    if (step.when && !step.when(config)) {
      continue;
    }

    const planStep: InstallationPlanStep = {
      name: step.name,
      meta: step.meta,
      children: [],
    };

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

/** Snapshot current execution as InProgressInstallationState. */
function snapshot(context: StepExecutionContext): InProgressInstallationState {
  return {
    installationId: context.installationId,
    startedAt: context.startedAt,
    status: "in-progress",
    steps: context.steps,
    data: context.data,
  };
}

/** Executes a single step (branch or leaf) recursively. */
async function executeStep(
  step: AnyStep,
  stepStatus: StepStatus,
  inherited: Record<string, unknown>,
  context: StepExecutionContext,
): Promise<void> {
  const { path } = stepStatus;
  const isLeaf = isLeafStep(step);

  stepStatus.status = "in-progress";
  await callHook(
    context.hooks,
    "onStepStart",
    { path, stepName: step.name, isLeaf },
    snapshot(context),
  );

  try {
    if (isBranchStep(step)) {
      await executeBranchStep(step, stepStatus, inherited, context);
    } else if (isLeafStep(step)) {
      await executeLeafStep(step, stepStatus, inherited, context);
    }

    stepStatus.status = "succeeded";
    await callHook(
      context.hooks,
      "onStepSuccess",
      {
        path,
        stepName: step.name,
        isLeaf,
        result: getAtPath(context.data, path),
      },
      snapshot(context),
    );
  } catch (err) {
    stepStatus.status = "failed";

    context.error ??= createInstallationError(err, path);
    await callHook(
      context.hooks,
      "onStepFailure",
      { path, stepName: step.name, isLeaf, error: context.error },
      snapshot(context),
    );

    throw err;
  }
}

/** Executes a branch step by processing its children. */
async function executeBranchStep(
  step: BranchStep,
  stepStatus: StepStatus,
  inherited: Record<string, unknown>,
  context: StepExecutionContext,
): Promise<void> {
  let childContext = inherited;
  if (step.context) {
    const stepContext = await step.context(context.installationContext);
    childContext = { ...inherited, ...stepContext };
  }

  for (const child of stepStatus.children) {
    const childStep = step.children.find((c) => c.name === child.name);
    if (!childStep) {
      throw new Error(`Step "${child.name}" not found`);
    }

    await executeStep(childStep, child, childContext, context);
  }
}

/** Executes a leaf step and stores its result. */
async function executeLeafStep(
  step: LeafStep,
  stepStatus: StepStatus,
  inherited: Record<string, unknown>,
  context: StepExecutionContext,
): Promise<void> {
  const executionContext = { ...context.installationContext, ...inherited };
  const result = await step.run(context.config, executionContext);

  setAtPath(context.data, stepStatus.path, result);
}
