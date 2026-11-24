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

import { PlannedStepError } from "./errors";
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
} from "./utils";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecyclePlan,
} from "#management/common/orchestration";
import type { WorkflowHooks } from "./hooks";
import type { AnyStep, BranchStep, LifecycleContext } from "./step";
import type {
  FailedWorkflowState,
  InProgressWorkflowState,
  StepStatus,
  SucceededWorkflowState,
  WorkflowData,
} from "./types";

/** Options for creating the initial execution state for a lifecycle plan. */
export type CreateInitialPlanExecutionStateOptions = {
  rootStep: BranchStep;
  targetConfig?: CommerceAppConfigOutputModel;
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

  /** The baseline snapshot the plan transitions from, or `null` when nothing is installed. */
  baseline: AppStateSnapshot | null;

  /**
   * Names of the root step's children grouped into the stages they run in. The children of a
   * stage run at the same time, and a stage starts once the previous one succeeds. Must list every
   * root child exactly once, in declared order. Defaults to every child running in declared order.
   *
   * @example
   * ```ts
   * rootStages: [["eventing", "webhooks", "admin-ui"], ["customInstallationSteps"]]
   * ```
   */
  rootStages?: readonly (readonly string[])[];
};

/** Outcome of executing the `apply` methods selected by a persisted plan. */
export type PlannedWorkflowResult = {
  state: SucceededWorkflowState | FailedWorkflowState;
};

/** Mutable state shared while executing a persisted lifecycle plan. */
type PlannedStepExecutionContext = {
  config: CommerceAppConfigOutputModel | undefined;
  baseline: AppStateSnapshot | null;
  id: string;
  startedAt: string;
  rootStep: StepStatus;
  data: Record<string, unknown> | null;
  hooks?: WorkflowHooks;
  attemptId: string;
  plan: LifecyclePlan;
  rootStages: readonly (readonly string[])[] | undefined;
};

/** What a step inherits from its ancestors. */
type InheritedStepInputs = {
  /** The values the ancestors' `context` factories returned. */
  accumulatedContext: Record<string, unknown>;
  configurationFlags: StepConfigurationFlags;
  lifecycleContext: LifecycleContext;
};

/** The logger methods that write a message. */
const LOGGER_METHODS = [
  "error",
  "warn",
  "info",
  "log",
  "verbose",
  "debug",
  "silly",
] as const;

/**
 * Creates an initial execution state pruned to leaves with planned operations. A leaf with config
 * changes but no operations, because its items are already in place, is kept as `succeeded`.
 */
export function createInitialPlanExecutionState(
  options: CreateInitialPlanExecutionStateOptions,
): InProgressWorkflowState {
  const { plan, rootStep, targetConfig } = options;
  return {
    config: targetConfig,
    data: null,
    id: crypto.randomUUID(),
    startedAt: nowIsoString(),
    status: "in-progress",
    step: buildInitialPlanExecutionStepStatus(rootStep, [], plan) as StepStatus,
  };
}

/**
 * Builds the execution progress for the branches and leaves a plan selects, or `null` when the
 * plan selects none under the step. A leaf with operations is `pending`. A leaf with changes only
 * is `succeeded`, as is a branch whose children all are, so the executor skips them without
 * calling the branch's `context`. The root stays `pending`, so it always runs as it does with no
 * operations to run.
 */
function buildInitialPlanExecutionStepStatus(
  step: AnyStep,
  parentPath: string[],
  plan: LifecyclePlan,
): StepStatus | null {
  const path = [...parentPath, step.name];
  const isRoot = parentPath.length === 0;
  const children = isBranchStep(step)
    ? step.children.flatMap((child) => {
        const status = buildInitialPlanExecutionStepStatus(child, path, plan);
        return status ? [status] : [];
      })
    : [];

  const domain = isLeafStep(step)
    ? plan.domains.find((candidate) => pathsEqual(candidate.path, path))
    : undefined;
  const hasOperations = (domain?.operations.length ?? 0) > 0;
  const isSatisfied = !hasOperations && (domain?.changes?.length ?? 0) > 0;

  if (!(isRoot || isSatisfied || hasOperations || children.length > 0)) {
    return null;
  }

  const meta = step.meta[plan.operation];

  if (!meta) {
    throw new Error(
      `Step "${step.name}" does not define metadata for an "${plan.operation}" lifecycle operation`,
    );
  }

  const isSucceeded =
    isSatisfied ||
    (!isRoot &&
      children.length > 0 &&
      children.every((child) => child.status === "succeeded"));

  return {
    children,
    id: crypto.randomUUID(),
    meta,
    name: step.name,
    path,
    status: isSucceeded ? "succeeded" : "pending",
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
    config: plan.target?.config,
    data: initialState.data as Record<string, unknown> | null,
    hooks,
    id: initialState.id,
    plan,
    rootStages: options.rootStages,
    rootStep: step,
    startedAt: initialState.startedAt,
  };

  await callHook(hooks, "onStart", snapshot(context));
  try {
    const rootConfigurationFlags = {
      configuredInBaseline: isConfiguredInBaseline(rootStep, context, true),
      configuredInTarget: isConfiguredInTarget(rootStep, context, true),
    };
    await executePlannedStep(
      rootStep,
      context.rootStep,
      {
        accumulatedContext: {},
        configurationFlags: rootConfigurationFlags,
        lifecycleContext,
      },
      context,
    );
    const succeeded = createSucceededState({
      config: context.config,
      data: context.data,
      id: context.id,
      startedAt: context.startedAt,
      step: context.rootStep,
    });

    await callHook(hooks, "onSuccess", succeeded);
    return { state: succeeded };
  } catch (error) {
    const workflowError =
      error instanceof PlannedStepError
        ? error.workflowError
        : await createWorkflowError(error, [], failureKey);

    const failed = createFailedState(
      {
        config: context.config,
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

/** Creates an in-progress state snapshot from the current planned execution. */
function snapshot(
  context: PlannedStepExecutionContext,
): InProgressWorkflowState {
  return {
    config: context.config,
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
  config: CommerceAppConfigOutputModel,
  isParentConfigured: boolean,
): boolean {
  return isParentConfigured && isStepConfigured(step, config);
}

/** Whether a step and its parent are configured in the baseline. Always `false` without one. */
function isConfiguredInBaseline(
  step: AnyStep,
  context: PlannedStepExecutionContext,
  isParentConfigured: boolean,
): boolean {
  return (
    context.baseline !== null &&
    areStepAndParentConfigured(
      step,
      context.baseline.config,
      isParentConfigured,
    )
  );
}

/** Whether a step and its parent are configured in the target. Always `false` without one. */
function isConfiguredInTarget(
  step: AnyStep,
  context: PlannedStepExecutionContext,
  isParentConfigured: boolean,
): boolean {
  return (
    context.config !== undefined &&
    areStepAndParentConfigured(step, context.config, isParentConfigured)
  );
}

/** The baseline config and data a leaf applies against, or `null` when it has none. */
function getLeafBaseline(
  context: PlannedStepExecutionContext,
  path: string[],
  configurationFlags: StepConfigurationFlags,
) {
  return configurationFlags.configuredInBaseline && context.baseline
    ? {
        config: context.baseline.config,
        data: getAtPath(context.baseline.data ?? {}, path) as WorkflowData,
      }
    : null;
}

/** Executes one planned step and updates its persisted progress snapshot. */
async function executePlannedStep(
  step: AnyStep,
  currentStep: StepStatus,
  inherited: InheritedStepInputs,
  context: PlannedStepExecutionContext,
): Promise<void> {
  if (currentStep.status === "succeeded") {
    return;
  }

  const { path } = currentStep;
  const { accumulatedContext, configurationFlags, lifecycleContext } =
    inherited;

  const isLeaf = isLeafStep(step);
  currentStep.status = "in-progress";
  currentStep.startedAt = nowIsoString();

  try {
    await callHook(
      context.hooks,
      "onStepStart",
      { isLeaf, path, stepName: step.name },
      snapshot(context),
    );

    if (isBranchStep(step)) {
      await executePlannedChildren(step, currentStep, inherited, context);
    } else if (isLeafStep(step)) {
      const domainPlan = context.plan.domains.find((candidate) =>
        pathsEqual(candidate.path, path),
      );

      if (!(domainPlan && step.apply)) {
        throw new Error(`Step "${step.name}" cannot apply its lifecycle plan`);
      }

      const result = await step.apply(domainPlan, {
        ...lifecycleContext,
        ...accumulatedContext,
        attemptId: context.attemptId,
        baseline: getLeafBaseline(context, path, configurationFlags),
        targetConfig:
          configurationFlags.configuredInTarget && context.config
            ? context.config
            : null,
      });

      context.data ??= {};
      setAtPath(context.data, path, result.snapshotData);
    }

    currentStep.status = "succeeded";
    currentStep.completedAt = nowIsoString();
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
  } catch (error) {
    currentStep.status = "failed";
    currentStep.completedAt = nowIsoString();

    const failure =
      error instanceof PlannedStepError
        ? error
        : new PlannedStepError(await createWorkflowError(error, path), {
            cause: error,
          });

    try {
      await callHook(
        context.hooks,
        "onStepFailure",
        { error: failure.workflowError, isLeaf, path, stepName: step.name },
        snapshot(context),
      );
    } catch (hookError) {
      // Keep the step's own error as the reason the attempt failed.
      const reason =
        hookError instanceof Error ? hookError.message : String(hookError);
      lifecycleContext.logger.warn(
        `Failed to record the failure of step ${path.join("/")}: ${reason}`,
      );
    }

    throw failure;
  }
}

/**
 * Executes the children of a branch stage by stage. The children of a stage run at the same time
 * and all finish before the stage fails, which it does with the error of its first failed child
 * in declared order. A stage only starts once the previous one succeeds.
 */
async function executePlannedChildren(
  step: BranchStep,
  currentStep: StepStatus,
  inherited: InheritedStepInputs,
  context: PlannedStepExecutionContext,
): Promise<void> {
  let childContext = inherited.accumulatedContext;

  if (step.context && currentStep.children.length > 0) {
    const stepContext = await step.context(inherited.lifecycleContext);
    childContext = {
      ...childContext,
      ...stepContext,
    };
  }

  const stages =
    currentStep === context.rootStep && context.rootStages
      ? groupIntoStages(step, currentStep.children, context.rootStages)
      : currentStep.children.map((child) => [child]);

  for (const stage of stages) {
    // biome-ignore lint/performance/noAwaitInLoops: each stage starts once the previous one succeeds
    const results = await Promise.allSettled(
      stage.map(async (childStatus) => {
        const child = step.children.find(
          (candidate) => candidate.name === childStatus.name,
        );

        if (!child) {
          throw new Error(`Step "${childStatus.name}" not found`);
        }

        await executePlannedStep(
          child,
          childStatus,
          {
            accumulatedContext: childContext,
            configurationFlags: {
              configuredInBaseline: isConfiguredInBaseline(
                child,
                context,
                inherited.configurationFlags.configuredInBaseline,
              ),
              configuredInTarget: isConfiguredInTarget(
                child,
                context,
                inherited.configurationFlags.configuredInTarget,
              ),
            },
            lifecycleContext:
              stage.length > 1
                ? withLabeledLogger(inherited.lifecycleContext, child.name)
                : inherited.lifecycleContext,
          },
          context,
        );
      }),
    );

    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      throw failed.reason;
    }
  }
}

/**
 * Splits the children to execute into the given stages, skipping the stages left with none.
 * Throws when the stages don't list every child of the step exactly once, in declared order.
 */
function groupIntoStages(
  step: BranchStep,
  children: StepStatus[],
  stageNames: readonly (readonly string[])[],
): StepStatus[][] {
  const declared = step.children.map((child) => child.name);
  const staged = stageNames.flat();

  if (
    staged.length !== declared.length ||
    staged.some((name, index) => name !== declared[index])
  ) {
    throw new Error(
      `Stages [${staged.join(", ")}] must list the children of step "${step.name}" in declared order: [${declared.join(", ")}]`,
    );
  }

  return stageNames
    .map((names) => children.filter((child) => names.includes(child.name)))
    .filter((stage) => stage.length > 0);
}

/** Returns the lifecycle context with a logger that prefixes every message with the branch name. */
function withLabeledLogger(
  lifecycleContext: LifecycleContext,
  branchName: string,
): LifecycleContext {
  const { logger } = lifecycleContext;
  const label = `[${branchName}]`;
  const labeled: LifecycleContext["logger"] = Object.create(logger);

  for (const method of LOGGER_METHODS) {
    labeled[method] = (...data: (object | string)[]) => {
      const [message, ...rest] = data;
      const args =
        typeof message === "string"
          ? [`${label} ${message}`, ...rest]
          : [label, ...data];

      logger[method](...args);
    };
  }

  return { ...lifecycleContext, logger: labeled };
}
