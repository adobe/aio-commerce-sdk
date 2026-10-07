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

import { executePlannedWorkflow } from "#management/common/workflow/execute";
import { nowIsoString, pathsEqual } from "#management/common/workflow/utils";

import {
  InvalidExecutionDeadlineError,
  LifecycleAttemptActionVersionMismatchError,
  LifecycleAttemptAlreadyExecutingError,
  LifecycleAttemptNotFoundError,
  LifecycleBaselineNotFoundError,
} from "./errors";
import {
  persistApplyFailure,
  persistProgress,
  persistSuccess,
} from "./persistence";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
  requireCurrentAttempt,
  requireState,
} from "./state";

import type {
  AppStateSnapshot,
  LifecycleAttempt,
  OrchestrationState,
} from "#management/common/orchestration";
import type { WorkflowHooks } from "#management/common/workflow/hooks";
import type { LifecycleContext } from "#management/common/workflow/step";
import type {
  FailedWorkflowState,
  InProgressWorkflowState,
  SucceededWorkflowState,
  WorkflowRunState,
} from "#management/common/workflow/types";
import type { LifecycleRuntime, LifecycleStore } from "./state";

/** Inputs used by the asynchronous lifecycle executor. */
export type ExecuteLifecycleAttemptOptions = Omit<
  LifecycleRuntime,
  "attemptStore" | "baselineProvider" | "planStore"
> & {
  actionVersion: string;
  attemptId: string;
  executionDeadline: string;

  /** Identifier of the OpenWhisk activation that executes the attempt. */
  activationId: string;
};

/**
 * Executes the current attempt once and persists its
 * terminal state and successful snapshot.
 */
export async function executeLifecycleAttempt(
  options: ExecuteLifecycleAttemptOptions,
): Promise<LifecycleAttempt> {
  const { logger } = options.lifecycleContext;

  let state = await requireState(options.stateStore);
  const currentAttempt = state.latestAttempt;

  if (!currentAttempt || currentAttempt.id !== options.attemptId) {
    throw new LifecycleAttemptNotFoundError(options.attemptId);
  }

  if (
    currentAttempt.status === "succeeded" ||
    currentAttempt.status === "failed"
  ) {
    return currentAttempt;
  }

  if (currentAttempt.status === "in-progress") {
    throw new LifecycleAttemptAlreadyExecutingError(currentAttempt.id);
  }

  if (currentAttempt.plan.actionVersion !== options.actionVersion) {
    return await failPendingAttempt(
      options,
      state,
      currentAttempt,
      new LifecycleAttemptActionVersionMismatchError(
        currentAttempt.plan.actionVersion,
      ),
    );
  }

  const executionDeadline = Date.parse(options.executionDeadline);
  if (!Number.isFinite(executionDeadline) || executionDeadline <= Date.now()) {
    return await failPendingAttempt(
      options,
      state,
      currentAttempt,
      new InvalidExecutionDeadlineError(options.executionDeadline),
    );
  }

  const { source } = currentAttempt.plan;
  const baseline = source
    ? await options.snapshotStore.get(source.snapshotId)
    : null;

  if (source && !baseline) {
    return await failPendingAttempt(
      options,
      state,
      currentAttempt,
      new LifecycleBaselineNotFoundError(),
    );
  }

  const attempt: LifecycleAttempt = {
    ...currentAttempt,
    activations: {
      ...currentAttempt.activations,
      execution: options.activationId,
    },
    executionDeadline: options.executionDeadline,
    status: "in-progress",
  };

  state = { ...state, latestAttempt: attempt };

  await options.stateStore.put(CURRENT_STATE_KEY, state);
  state = await normalizeExpiredAttempt(options.stateStore, state, logger);

  const hooks = createProgressHooks(options.stateStore, attempt, logger);
  const workflow = await executePlan(options, attempt, baseline, hooks);

  state = await requireCurrentAttempt(options.stateStore, attempt.id);
  if (workflow.status === "failed") {
    return persistApplyFailure(options.stateStore, state, attempt, workflow);
  }

  return persistSuccess(options, state, attempt, workflow);
}

/**
 * Records a pending attempt that cannot start as failed, logs it, then throws why.
 *
 * @param options - The execution options, with the orchestration state store and the logger.
 * @param state - The current orchestration state.
 * @param attempt - The pending attempt.
 * @param error - Why the attempt cannot start.
 */
async function failPendingAttempt(
  options: Pick<
    ExecuteLifecycleAttemptOptions,
    "lifecycleContext" | "stateStore"
  >,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  error: Error,
): Promise<never> {
  const { stateStore, lifecycleContext } = options;
  const { logger } = lifecycleContext;

  // A pending attempt counts as in progress, so leaving it would block every request until its deadline.
  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: {
      ...attempt,
      completedAt: nowIsoString(),
      failure: {
        key: "LIFECYCLE_START_FAILED",
        message: error.message,
        path: [],
      },
      status: "failed",
    },
  });

  logger.error(
    `The ${attempt.operation} attempt ${attempt.id} could not start and was marked failed: ${error.message}`,
  );

  throw error;
}

/** Creates hooks that log every step transition and persist execution progress after it. */
function createProgressHooks(
  stateStore: LifecycleStore<OrchestrationState>,
  attempt: LifecycleAttempt,
  logger: LifecycleContext["logger"],
): WorkflowHooks {
  const persistExecutionProgress = (progressState: WorkflowRunState) =>
    persistProgress(stateStore, attempt.id, progressState);

  const prefix = `The ${attempt.operation} attempt ${attempt.id}`;
  return {
    onStepFailure: (event, progressState) => {
      // Every ancestor of the failed step fails after it, so only the step that raised the error is logged.
      if (pathsEqual(event.path, event.error.path)) {
        logger.error(
          `${prefix} failed at step ${event.path.join("/")}: ${event.error.message ?? event.error.key}`,
        );
      }

      return persistExecutionProgress(progressState);
    },
    onStepStart: (event, progressState) => {
      logger.debug(`${prefix} started step ${event.path.join("/")}.`);
      return persistExecutionProgress(progressState);
    },
    onStepSuccess: (event, progressState) => {
      logger.debug(`${prefix} completed step ${event.path.join("/")}.`);
      return persistExecutionProgress(progressState);
    },
  };
}

/** Applies an attempt's plan once. */
async function executePlan(
  options: ExecuteLifecycleAttemptOptions,
  attempt: LifecycleAttempt,
  baseline: AppStateSnapshot | null,
  hooks: WorkflowHooks,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  const result = await executePlannedWorkflow({
    attemptId: attempt.id,
    baseline,
    failureKey: "LIFECYCLE_APPLY_FAILED",
    hooks,
    initialState: toWorkflowState(attempt, attempt.plan.target?.config),
    lifecycleContext: options.lifecycleContext,
    plan: attempt.plan,
    rootStep: options.rootStep,
  });

  return result.state;
}

/** Recreates workflow execution state from a persisted lifecycle attempt. */
function toWorkflowState(
  attempt: LifecycleAttempt,
  config?: AppStateSnapshot["config"],
): InProgressWorkflowState {
  return {
    config,
    data: attempt.data,
    id: attempt.id,
    startedAt: attempt.startedAt,
    status: "in-progress",
    step: attempt.progress,
  };
}
