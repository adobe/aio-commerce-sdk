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
  PendingInstallationState,
  StepStatus,
  SucceededInstallationState,
} from "./types";

/** Options for creating an initial installation state. */
export type CreateInitialStateOptions = {
  /** The root branch step to build the state from. */
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

  /** The initial installation state (with all steps pending). */
  initialState: PendingInstallationState;

  /** Lifecycle hooks for status change notifications. */
  hooks?: InstallationHooks;
};

/** Context for step execution containing all necessary dependencies. */
type StepExecutionContext = {
  installationContext: InstallationContext;
  config: CommerceAppConfigOutputModel;
  id: string;
  startedAt: string;
  step: StepStatus;
  data: Record<string, unknown> | null;
  error: InstallationError | null;
  hooks?: InstallationHooks;
};

/**
 * Creates an initial installation state from a root step and config.
 * Filters steps based on their `when` conditions and builds a tree structure
 * with all steps set to "pending".
 */
export function createInitialState(
  options: CreateInitialStateOptions,
): PendingInstallationState {
  const { rootStep, config } = options;
  return {
    id: crypto.randomUUID(),
    status: "pending",
    step: buildInitialStepStatus(rootStep, config, []),
    data: null,
  };
}

/**
 * Executes a workflow from an initial state. Returns the final state (never throws).
 */
export async function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededInstallationState | FailedInstallationState> {
  const { rootStep, installationContext, config, initialState, hooks } =
    options;

  // Deep clone the step status so we don't mutate the original
  const step = structuredClone(initialState.step);
  const context: StepExecutionContext = {
    installationContext,
    config,
    id: initialState.id,
    startedAt: nowIsoString(),
    step,
    data: null,
    error: null,
    hooks,
  };

  await callHook(hooks, "onInstallationStart", snapshot(context));
  try {
    // Execute the root step
    await executeStep(rootStep, context.step, {}, context);
    const succeeded = createSucceededState({
      id: context.id,
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
        id: context.id,
        startedAt: context.startedAt,
        data: context.data,
      },
      error,
    );

    await callHook(hooks, "onInstallationFailure", failed);
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
): StepStatus {
  const path = [...parentPath, step.name];
  const children: StepStatus[] = [];

  if (isBranchStep(step) && step.children.length > 0) {
    for (const child of step.children) {
      // Skip steps that don't match their `when` condition
      if (child.when && !child.when(config)) {
        continue;
      }

      children.push(buildInitialStepStatus(child, config, path));
    }
  }

  return {
    id: crypto.randomUUID(),
    name: step.name,
    path,
    meta: step.meta,
    status: "pending" as const,
    children,
  };
}

/** Snapshot current execution as InProgressInstallationState. */
function snapshot(context: StepExecutionContext): InProgressInstallationState {
  return {
    id: context.id,
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
