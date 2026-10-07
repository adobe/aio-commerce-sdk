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
import { nowIsoString } from "#management/common/workflow/utils";

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
  "baselineProvider"
> & {
  actionVersion: string;
  attemptId: string;
  executionDeadline: string;
};

/**
 * Executes the current attempt once and persists its
 * terminal state and successful snapshot.
 */
export async function executeLifecycleAttempt(
  options: ExecuteLifecycleAttemptOptions,
): Promise<LifecycleAttempt> {
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
      options.stateStore,
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
      options.stateStore,
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
      options.stateStore,
      state,
      currentAttempt,
      new LifecycleBaselineNotFoundError(),
    );
  }

  const attempt: LifecycleAttempt = {
    ...currentAttempt,
    executionDeadline: options.executionDeadline,
    status: "in-progress",
  };

  state = { ...state, latestAttempt: attempt };

  await options.stateStore.put(CURRENT_STATE_KEY, state);
  state = await normalizeExpiredAttempt(options.stateStore, state);

  const hooks = createProgressHooks(options.stateStore, attempt.id);
  const workflow = await executePlan(options, attempt, baseline, hooks);

  state = await requireCurrentAttempt(options.stateStore, attempt.id);
  if (workflow.status === "failed") {
    return persistApplyFailure(options.stateStore, state, attempt, workflow);
  }

  return persistSuccess(options, state, attempt, workflow);
}

/**
 * Records a pending attempt that cannot start as failed, then throws why.
 *
 * @param stateStore - The orchestration state store.
 * @param state - The current orchestration state.
 * @param attempt - The pending attempt.
 * @param error - Why the attempt cannot start.
 */
async function failPendingAttempt(
  stateStore: LifecycleStore<OrchestrationState>,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  error: Error,
): Promise<never> {
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

  throw error;
}

/** Creates hooks that persist execution progress after every step transition. */
function createProgressHooks(
  stateStore: LifecycleStore<OrchestrationState>,
  attemptId: string,
): WorkflowHooks {
  const persistExecutionProgress = (progressState: WorkflowRunState) =>
    persistProgress(stateStore, attemptId, progressState);
  return {
    onStepFailure: (_event, progressState) =>
      persistExecutionProgress(progressState),
    onStepStart: (_event, progressState) =>
      persistExecutionProgress(progressState),
    onStepSuccess: (_event, progressState) =>
      persistExecutionProgress(progressState),
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
