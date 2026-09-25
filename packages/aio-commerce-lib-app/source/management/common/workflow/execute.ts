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
  pathsEqual,
  setAtPath,
  toDataPath,
} from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecyclePlan,
} from "#management/common/orchestration";
import type { WorkflowHooks } from "./hooks";
import type { AnyStep, BranchStep, LeafStep, LifecycleContext } from "./step";
import type {
  FailedWorkflowState,
  InProgressWorkflowState,
  StepStatus,
  SucceededWorkflowState,
  WorkflowData,
  WorkflowError,
} from "./types";

/** Options for creating the initial execution state for a lifecycle plan. */
export type CreateInitialPlanExecutionStateOptions = {
  rootStep: BranchStep;
  plan: LifecyclePlan;
};

/** Options for executing the `apply` methods selected by a persisted plan. */
export type ExecutePlannedWorkflowOptions = {
  rootStep: BranchStep;
  lifecycleContext: LifecycleContext;
  initialState: InProgressWorkflowState;
  hooks?: WorkflowHooks;
  failureKey?: string;
  attemptId: string;
  plan: LifecyclePlan;

  /** The baseline snapshot the plan transitions from, or `null` for an install. */
  baseline: AppStateSnapshot | null;
};

/** Outcome of executing the `apply` methods selected by a persisted plan. */
export type PlannedWorkflowResult = {
  state: SucceededWorkflowState | FailedWorkflowState;
};

/** Mutable state shared while executing a persisted lifecycle plan. */
type PlannedStepExecutionContext = {
  lifecycleContext: LifecycleContext;
  config: CommerceAppConfigOutputModel | null;
  baseline: AppStateSnapshot | null;
  id: string;
  startedAt: string;
  rootStep: StepStatus;
  data: Record<string, unknown> | null;
  error: WorkflowError | null;
  hooks?: WorkflowHooks;
  attemptId: string;
  plan: LifecyclePlan;
};

/** Creates an initial execution state pruned to leaves with planned operations. */
export function createInitialPlanExecutionState(
  options: CreateInitialPlanExecutionStateOptions,
): InProgressWorkflowState {
  const { plan, rootStep } = options;
  return {
    config: plan.target?.config,
    data: null,
    id: crypto.randomUUID(),
    startedAt: nowIsoString(),
    status: "in-progress",
    step: buildInitialPlanExecutionStepStatus(rootStep, [], plan),
  };
}

/** Builds pending execution progress for branches and leaves selected by a plan. */
function buildInitialPlanExecutionStepStatus(
  step: AnyStep,
  parentPath: string[],
  plan: LifecyclePlan,
): StepStatus {
  const path = [...parentPath, step.name];
  const children = isBranchStep(step)
    ? step.children
        .filter((child) => hasPlannedOperations(child, plan, path))
        .map((child) => buildInitialPlanExecutionStepStatus(child, path, plan))
    : [];

  const meta = step.meta[plan.operation];

  if (!meta) {
    throw new Error(
      `Step "${step.name}" does not define metadata for an "${plan.operation}" lifecycle operation`,
    );
  }

  return {
    children,
    id: crypto.randomUUID(),
    meta,
    name: step.name,
    path,
    status: "pending",
  };
}

/** Executes the `apply` methods selected by a persisted lifecycle plan. */
export async function executePlannedWorkflow(
  options: ExecutePlannedWorkflowOptions,
): Promise<PlannedWorkflowResult> {
  const {
    rootStep,
    lifecycleContext,
    initialState,
    hooks,
    failureKey = "WORKFLOW_FAILED",
    attemptId,
    plan,
  } = options;

  const step = structuredClone(initialState.step);
  const context: PlannedStepExecutionContext = {
    attemptId,
    baseline: options.baseline,
    config: plan.target?.config ?? null,
    data: initialState.data as Record<string, unknown> | null,
    error: null,
    hooks,
    id: initialState.id,
    lifecycleContext,
    plan,
    rootStep: step,
    startedAt: initialState.startedAt,
  };

  await callHook(hooks, "onStart", snapshot(context));
  try {
    const rootConfigurationFlags = {
      configuredInBaseline: areStepAndParentConfigured(
        rootStep,
        context.baseline?.config ?? null,
        true,
      ),
      configuredInTarget: areStepAndParentConfigured(
        rootStep,
        context.config,
        true,
      ),
    };
    await executePlannedStep(
      rootStep,
      context.rootStep,
      {},
      context,
      rootConfigurationFlags,
    );
    const succeeded = createSucceededState({
      config: context.config ?? undefined,
      data: context.data,
      id: context.id,
      startedAt: context.startedAt,
      step: context.rootStep,
    });

    await callHook(hooks, "onSuccess", succeeded);
    return { state: succeeded };
  } catch (error) {
    const workflowError =
      context.error ?? (await createWorkflowError(error, [], failureKey));

    const failed = createFailedState(
      {
        config: context.config ?? undefined,
        data: context.data,
        id: context.id,
        startedAt: context.startedAt,
        step: context.rootStep,
      },
      workflowError,
    );

    await callHook(hooks, "onFailure", failed);
    return { state: failed };
  }
}

/** Returns whether a step or one of its descendants has planned operations. */
function hasPlannedOperations(
  step: AnyStep,
  plan: LifecyclePlan,
  parentPath: string[],
): boolean {
  const path = [...parentPath, step.name];

  if (isBranchStep(step)) {
    return step.children.some((child) =>
      hasPlannedOperations(child, plan, path),
    );
  }

  return plan.domains.some(
    (domain) => pathsEqual(domain.path, path) && domain.operations.length > 0,
  );
}

/** Creates an in-progress state snapshot from the current planned execution. */
function snapshot(
  context: PlannedStepExecutionContext,
): InProgressWorkflowState {
  return {
    config: context.config ?? undefined,
    data: context.data,
    id: context.id,
    startedAt: context.startedAt,
    status: "in-progress",
    step: context.rootStep,
  };
}

/** Whether a step is configured in the baseline and/or target. */
type StepConfigurationFlags = {
  configuredInBaseline: boolean;
  configuredInTarget: boolean;
};

/**
 * Returns true when both the parent and this step are configured.
 *
 * Example: For `installation -> webhooks -> subscriptions`, `subscriptions` is not
 * configured when its `webhooks` parent is absent from the app config.
 */
function areStepAndParentConfigured(
  step: AnyStep,
  config: CommerceAppConfigOutputModel | null,
  isParentConfigured: boolean,
): boolean {
  return isParentConfigured && isStepConfigured(step, config);
}

/** Applies the domain plan selected for a leaf and records its snapshot data. */
/** Runs a branch's planned children in declared order, under the branch's step context. */
async function executePlannedBranch(
  step: BranchStep,
  currentStep: StepStatus,
  accumulatedContext: Record<string, unknown>,
  context: PlannedStepExecutionContext,
  configurationFlags: StepConfigurationFlags,
): Promise<void> {
  let childContext = accumulatedContext;

  if (step.context && currentStep.children.length > 0) {
    const stepContext = await step.context(context.lifecycleContext);
    childContext = {
      ...accumulatedContext,
      ...stepContext,
    };
  }

  for (const childStatus of currentStep.children) {
    const child = step.children.find(
      (candidate) => candidate.name === childStatus.name,
    );

    if (!child) {
      throw new Error(`Step "${childStatus.name}" not found`);
    }

    // biome-ignore lint/performance/noAwaitInLoops: plan steps execute in declared order
    await executePlannedStep(child, childStatus, childContext, context, {
      configuredInBaseline: areStepAndParentConfigured(
        child,
        context.baseline?.config ?? null,
        configurationFlags.configuredInBaseline,
      ),
      configuredInTarget: areStepAndParentConfigured(
        child,
        context.config,
        configurationFlags.configuredInTarget,
      ),
    });
  }
}

/** Applies a leaf's domain plan and saves the snapshot data it returns under the step's data path. */
async function applyPlannedLeaf(
  step: LeafStep,
  path: string[],
  accumulatedContext: Record<string, unknown>,
  context: PlannedStepExecutionContext,
  configurationFlags: StepConfigurationFlags,
): Promise<void> {
  const domainPlan = context.plan.domains.find((candidate) =>
    pathsEqual(candidate.path, path),
  );

  if (!(domainPlan && step.apply)) {
    throw new Error(`Step "${step.name}" cannot apply its lifecycle plan`);
  }

  const baseline =
    configurationFlags.configuredInBaseline && context.baseline
      ? {
          config: context.baseline.config,
          data: getAtPath(
            context.baseline.data ?? {},
            toDataPath(path),
          ) as WorkflowData,
        }
      : null;

  const result = await step.apply(domainPlan, {
    ...context.lifecycleContext,
    ...accumulatedContext,
    attemptId: context.attemptId,
    baseline,
    targetConfig: configurationFlags.configuredInTarget ? context.config : null,
  });

  context.data ??= {};
  setAtPath(context.data, toDataPath(path), result.snapshotData);
}

/** Executes one planned step and updates its persisted progress snapshot. */
async function executePlannedStep(
  step: AnyStep,
  currentStep: StepStatus,
  accumulatedContext: Record<string, unknown>,
  context: PlannedStepExecutionContext,
  configurationFlags: StepConfigurationFlags,
): Promise<void> {
  if (currentStep.status === "succeeded") {
    return;
  }

  const { path } = currentStep;
  const isLeaf = isLeafStep(step);
  currentStep.status = "in-progress";

  await callHook(
    context.hooks,
    "onStepStart",
    { isLeaf, path, stepName: step.name },
    snapshot(context),
  );

  try {
    if (isBranchStep(step)) {
      await executePlannedBranch(
        step,
        currentStep,
        accumulatedContext,
        context,
        configurationFlags,
      );
    } else if (isLeafStep(step)) {
      await applyPlannedLeaf(
        step,
        path,
        accumulatedContext,
        context,
        configurationFlags,
      );
    }

    currentStep.status = "succeeded";
    context.data ??= {};

    await callHook(
      context.hooks,
      "onStepSuccess",
      {
        isLeaf,
        path,
        result: getAtPath(context.data, toDataPath(path)),
        stepName: step.name,
      },
      snapshot(context),
    );
  } catch (error) {
    currentStep.status = "failed";
    context.error ??= await createWorkflowError(error, path);

    await callHook(
      context.hooks,
      "onStepFailure",
      { error: context.error, isLeaf, path, stepName: step.name },
      snapshot(context),
    );

    throw error;
  }
}
