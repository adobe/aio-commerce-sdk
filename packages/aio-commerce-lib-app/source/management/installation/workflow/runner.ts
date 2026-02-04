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

/** Options for building a plan from a root step. */
export type BuildPlanOptions = {
  /** The root branch step to build the plan from. */
  rootStep: BranchStep;

  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;
};

/** Options for executing a workflow. */
export type ExecuteWorkflowOptions = {
  /** The root branch step to execute. */
  rootStep: BranchStep;

  /** Shared installation context (params, logger, etc.). */
  installationContext: InstallationContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The pre-created installation plan to execute. */
  plan: InstallationPlan;

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
  step: StepStatus;
  data: Record<string, unknown> | null;
  error: InstallationError | null;
  registry: StepRegistry;
  hooks?: InstallationHooks;
};

/**
 * Builds a plan from a root step and config.
 * Filters steps based on their `when` conditions and builds a tree structure.
 */
export function buildPlan(options: BuildPlanOptions): InstallationPlan {
  const { rootStep, config } = options;

  return {
    id: crypto.randomUUID(),
    createdAt: nowIsoString(),
    step: buildPlanStep(rootStep, config),
  };
}

/**
 * Executes a workflow from a root step. Returns the final state (never throws).
 */
export async function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { rootStep, installationContext, config, plan, hooks } = options;
  const context: StepExecutionContext = {
    installationContext,
    config,
    installationId: plan.id,
    startedAt: nowIsoString(),
    step: buildInitialStepStatus(plan.step, []),
    data: null,
    error: null,
    registry: new Map(rootStep.children.map((step) => [step.name, step])),
    hooks,
  };

  await callHook(hooks, "onInstallationStart", snapshot(context));

  try {
    // Execute the root step
    await executeStep(rootStep, context.step, {}, context);
    const succeeded = createSucceededState({
      installationId: context.installationId,
      startedAt: context.startedAt,
      step: context.step,
      data: context.data,
    });

    await callHook(hooks, "onInstallationSuccess", succeeded);
    return succeeded;
  } catch (err) {
    const error =
      context.error ?? createInstallationError(err, [], "INSTALLATION_FAILED");

    const failed = createFailedState(
      {
        step: context.step,
        installationId: context.installationId,
        startedAt: context.startedAt,
        data: context.data,
      },
      error,
    );

    await callHook(hooks, "onInstallationFailure", failed);
    return failed;
  }
}

/** Builds a plan step from a step definition, filtering by `when` conditions. */
function buildPlanStep(
  step: AnyStep,
  config: CommerceAppConfigOutputModel,
): InstallationPlanStep {
  const planStep: InstallationPlanStep = {
    name: step.name,
    meta: step.meta,
    children: [],
  };

  if (isBranchStep(step) && step.children.length > 0) {
    planStep.children = buildPlanStepsForChildren(step.children, config);
  }

  return planStep;
}

/** Recursively builds plan steps for children, filtering by `when` conditions. */
function buildPlanStepsForChildren(
  steps: AnyStep[],
  config: CommerceAppConfigOutputModel,
): InstallationPlanStep[] {
  const planSteps: InstallationPlanStep[] = [];

  for (const step of steps) {
    if (step.when && !step.when(config)) {
      continue;
    }

    planSteps.push(buildPlanStep(step, config));
  }

  return planSteps;
}

/** Builds initial step status from a plan step. */
function buildInitialStepStatus(
  planStep: InstallationPlanStep,
  parentPath: string[],
): StepStatus {
  const path = [...parentPath, planStep.name];
  return {
    name: planStep.name,
    path,
    id: crypto.randomUUID(),
    status: "pending" as const,
    children: planStep.children.map((child) =>
      buildInitialStepStatus(child, path),
    ),
  };
}

/** Snapshot current execution as InProgressInstallationState. */
function snapshot(context: StepExecutionContext): InProgressInstallationState {
  return {
    installationId: context.installationId,
    startedAt: context.startedAt,
    status: "in-progress",
    step: context.step,
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
    context.data ??= {};

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

  context.data ??= {};
  setAtPath(context.data, stepStatus.path, result);
}
