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
  createSucceededState,
  createWorkflowError,
  getAtPath,
  isStepConfigured,
  nowIsoString,
  setAtPath,
} from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { WorkflowHooks } from "./hooks";
import type { AnyStep, BranchStep, LeafStep, LifecycleContext } from "./step";
import type {
  FailedWorkflowState,
  InProgressWorkflowState,
  StepStatus,
  SucceededWorkflowState,
  WorkflowError,
} from "./types";

/** Options for creating an initial workflow run state. */
export type CreateInitialStateOptions = {
  /** The root branch step to build the state from. */
  rootStep: BranchStep;

  /** The app configuration used to determine applicable steps. */
  config: CommerceAppConfigOutputModel;

  /** The execution mode. When "uninstall", steps use `meta.uninstall` if defined; defaults to "install". */
  mode?: ExecutionMode;
};

/** Options for executing a workflow. */
export type ExecuteWorkflowOptions = {
  /** The root branch step to execute. */
  rootStep: BranchStep;

  /** Shared lifecycle context (params, logger, etc.). */
  lifecycleContext: LifecycleContext;

  /** The app configuration. */
  config: CommerceAppConfigOutputModel;

  /** The initial workflow run state (with all steps pending). */
  initialState: InProgressWorkflowState;

  /** Lifecycle hooks for status change notifications. */
  hooks?: WorkflowHooks;

  /** Error key used for the top-level failure when no step-level error was captured. */
  failureKey?: string;
};

/** Execution mode: "install" or "uninstall". */
type ExecutionMode = "install" | "uninstall";

/** Context for step execution containing all necessary dependencies. */
type StepExecutionContext = {
  lifecycleContext: LifecycleContext;
  config: CommerceAppConfigOutputModel;
  id: string;
  startedAt: string;
  step: StepStatus;
  data: Record<string, unknown> | null;
  error: WorkflowError | null;
  hooks?: WorkflowHooks;
  mode: ExecutionMode;
};

/**
 * Creates an initial workflow run state from a root step and config.
 *
 * Filters steps based on whether their domains are configured and builds a
 * tree structure with all steps set to "pending".
 */
export function createInitialState(
  options: CreateInitialStateOptions,
): InProgressWorkflowState {
  const { rootStep, config, mode } = options;
  return {
    config,
    data: null,
    id: crypto.randomUUID(),
    startedAt: nowIsoString(),
    status: "in-progress",
    step: buildInitialStepStatus(rootStep, config, [], mode),
  };
}

/**
 * Creates a retry state from a failed state.
 * Preserves succeeded steps and their data so the workflow resumes from
 * the failed step rather than restarting from scratch.
 */
export function createRetryState(
  failedState: FailedWorkflowState,
): InProgressWorkflowState {
  return {
    config: failedState.config,
    data: failedState.data,
    id: failedState.id,
    startedAt: failedState.startedAt,
    status: "in-progress",
    step: resetFailedSteps(failedState.step),
  };
}

/** Recursively resets non-succeeded steps back to "pending". */
function resetFailedSteps(step: StepStatus): StepStatus {
  return {
    ...step,
    children: step.children.map(resetFailedSteps),
    status: step.status === "succeeded" ? "succeeded" : "pending",
  };
}

/**
 * Executes a workflow from an initial state. Returns the final state (never throws).
 */
export async function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  return executeWorkflowWithMode(options, "install");
}

/**
 * Executes an uninstall workflow from an initial state. Returns the final state (never throws).
 * Steps with an `uninstall` handler get it called; steps without are silently skipped.
 */
export async function executeUninstallWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  return executeWorkflowWithMode(options, "uninstall");
}

/** Executes a workflow using install or uninstall handlers for the selected mode. */
async function executeWorkflowWithMode(
  options: ExecuteWorkflowOptions,
  mode: ExecutionMode,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  const {
    rootStep,
    lifecycleContext,
    config,
    initialState,
    hooks,
    failureKey = "WORKFLOW_FAILED",
  } = options;

  // Deep clone the step status so we don't mutate the original
  const step = structuredClone(initialState.step);
  const context: StepExecutionContext = {
    config,
    data: initialState.data as Record<string, unknown> | null,
    error: null,
    hooks,
    id: initialState.id,
    lifecycleContext,
    mode,
    startedAt: initialState.startedAt,
    step,
  };

  await callHook(hooks, "onStart", snapshot(context));
  try {
    // Execute the root step
    await executeStep(rootStep, context.step, {}, context);
    const succeeded = createSucceededState({
      config: context.config,
      data: context.data,
      id: context.id,
      startedAt: context.startedAt,
      step: context.step,
    });

    await callHook(hooks, "onSuccess", succeeded);
    return succeeded;
  } catch (err) {
    const error =
      context.error ?? (await createWorkflowError(err, [], failureKey));

    const failed = createFailedState(
      {
        config: context.config,
        data: context.data,
        id: context.id,
        startedAt: context.startedAt,
        step: context.step,
      },
      error,
    );

    await callHook(hooks, "onFailure", failed);
    return failed;
  }
}

/**
 * Builds initial step status from a step definition.
 * Filters steps based on their `when` conditions.
 */
function buildInitialStepStatus(
  step: AnyStep,
  config: CommerceAppConfigOutputModel,
  parentPath: string[],
  mode?: ExecutionMode,
): StepStatus {
  const path = [...parentPath, step.name];
  const children: StepStatus[] = [];

  if (isBranchStep(step) && step.children.length > 0) {
    for (const child of step.children) {
      if (!isStepConfigured(child, config)) {
        continue;
      }

      children.push(buildInitialStepStatus(child, config, path, mode));
    }
  }

  return {
    children,
    id: crypto.randomUUID(),
    meta:
      mode === "uninstall" && step.meta.uninstall
        ? step.meta.uninstall
        : step.meta.install,
    name: step.name,
    path,
    status: "pending" as const,
  };
}

/** Snapshot current execution as InProgressWorkflowState. */
function snapshot(context: StepExecutionContext): InProgressWorkflowState {
  return {
    config: context.config,
    data: context.data,
    id: context.id,
    startedAt: context.startedAt,
    status: "in-progress",
    step: context.step,
  };
}

/** Executes a single step (branch or leaf) recursively. */
async function executeStep(
  step: AnyStep,
  stepStatus: StepStatus,
  inherited: Record<string, unknown>,
  context: StepExecutionContext,
): Promise<void> {
  if (stepStatus.status === "succeeded") {
    return;
  }

  const { path } = stepStatus;
  const isLeaf = isLeafStep(step);

  stepStatus.status = "in-progress";
  await callHook(
    context.hooks,
    "onStepStart",
    { isLeaf, path, stepName: step.name },
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
        isLeaf,
        path,
        result: getAtPath(context.data, path),
        stepName: step.name,
      },
      snapshot(context),
    );
  } catch (err) {
    stepStatus.status = "failed";

    context.error ??= await createWorkflowError(err, path);
    await callHook(
      context.hooks,
      "onStepFailure",
      { error: context.error, isLeaf, path, stepName: step.name },
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
    const stepContext = await step.context(context.lifecycleContext);
    childContext = { ...inherited, ...stepContext };
  }

  for (const child of stepStatus.children) {
    const childStep = step.children.find((c) => c.name === child.name);
    if (!childStep) {
      throw new Error(`Step "${child.name}" not found`);
    }

    // biome-ignore lint/performance/noAwaitInLoops: sibling steps run in declared order and can read data/state written by earlier steps into the shared lifecycle context
    await executeStep(childStep, child, childContext, context);
  }
}

/** Executes a leaf step and stores its result, or runs uninstall if in uninstall mode. */
async function executeLeafStep(
  step: LeafStep,
  stepStatus: StepStatus,
  inherited: Record<string, unknown>,
  context: StepExecutionContext,
): Promise<void> {
  const executionContext = { ...context.lifecycleContext, ...inherited };

  if (context.mode === "uninstall") {
    // Silently skip steps that don't have an uninstall handler
    if (step.uninstall) {
      await step.uninstall(context.config, executionContext);
    }
    return;
  }

  const result = await step.install(context.config, executionContext);

  context.data ??= {};
  setAtPath(context.data, stepStatus.path, result);
}
