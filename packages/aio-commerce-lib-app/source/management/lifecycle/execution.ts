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
import { createRetryState } from "#management/common/workflow/runner";

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
 * Executes the current attempt, retries failed leaves once, and persists its
 * terminal state and successful snapshot.
 */
export async function executeLifecycleAttempt(
  options: ExecuteLifecycleAttemptOptions,
): Promise<LifecycleAttempt> {
  let state = await requireState(options.stateStore);
  const currentAttempt = state.latestAttempt;
  if (!currentAttempt || currentAttempt.id !== options.attemptId) {
    throw new Error("The lifecycle attempt is missing or stale");
  }
  if (
    currentAttempt.status === "succeeded" ||
    currentAttempt.status === "failed"
  ) {
    return currentAttempt;
  }
  if (currentAttempt.plan.actionVersion !== options.actionVersion) {
    throw new Error(
      "The lifecycle attempt was created by another action version",
    );
  }
  if (currentAttempt.status === "in-progress") {
    throw new Error("The lifecycle attempt is already in progress");
  }

  const executionDeadline = Date.parse(options.executionDeadline);
  if (!Number.isFinite(executionDeadline) || executionDeadline <= Date.now()) {
    throw new Error("The lifecycle execution deadline is invalid or elapsed");
  }

  const baseline = await options.snapshotStore.get(
    currentAttempt.plan.source.snapshotId,
  );
  if (!baseline) {
    throw new Error("The lifecycle baseline snapshot is missing");
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
  const workflow = await executePlanWithRetry(
    options,
    attempt,
    baseline,
    hooks,
  );

  state = await requireCurrentAttempt(options.stateStore, attempt.id);
  if (workflow.status === "failed") {
    return persistApplyFailure(options.stateStore, state, attempt, workflow);
  }

  return persistSuccess(options, state, attempt, workflow);
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

/** Applies an attempt's plan and retries its failed leaves once. */
async function executePlanWithRetry(
  options: ExecuteLifecycleAttemptOptions,
  attempt: LifecycleAttempt,
  baseline: AppStateSnapshot,
  hooks: WorkflowHooks,
): Promise<SucceededWorkflowState | FailedWorkflowState> {
  const executionOptions = {
    attemptId: attempt.id,
    baseline,
    failureKey: "LIFECYCLE_APPLY_FAILED",
    hooks,
    lifecycleContext: options.lifecycleContext,
    plan: attempt.plan,
    rootStep: options.rootStep,
  };
  let result = await executePlannedWorkflow({
    ...executionOptions,
    initialState: toWorkflowState(attempt, attempt.plan.target.config),
  });
  if (result.state.status === "failed") {
    result = await executePlannedWorkflow({
      ...executionOptions,
      initialState: createRetryState(result.state),
    });
  }
  return result.state;
}

/** Recreates workflow execution state from a persisted lifecycle attempt. */
function toWorkflowState(
  attempt: LifecycleAttempt,
  config: AppStateSnapshot["config"],
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
