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

import { createInitialPlanExecutionState } from "#management/common/workflow/execute";

import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
  readOrInitializeState,
} from "./state";

import type {
  LifecycleAttempt,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleRuntime } from "./state";

/** Inputs used to consume a reviewed plan and create an attempt. */
export type StartLifecycleAttemptOptions = LifecycleRuntime & {
  actionVersion: string;
  executionDeadline: string;
  planId: string;
};

/**
 * Creates and persists an attempt for an exact pending plan, or resumes its
 * failed attempt when it is still eligible for retry.
 */
export async function startLifecycleAttempt(
  options: StartLifecycleAttemptOptions,
): Promise<LifecycleAttempt> {
  const loaded = await readOrInitializeState(options);
  const state = await normalizeExpiredAttempt(options.stateStore, loaded.state);
  const { baseline } = loaded;
  const plan = state.pendingPlan;

  if (!plan || plan.id !== options.planId) {
    const resumed = await resumeFailedAttempt(options, state);
    if (resumed) {
      return resumed;
    }
    throw new Error("The pending lifecycle plan is missing or stale");
  }
  if (plan.actionVersion !== options.actionVersion) {
    throw new Error(
      "The pending lifecycle plan was created by another action version",
    );
  }
  if (plan.issues.length > 0) {
    throw new Error("The lifecycle plan is blocked by planning issues");
  }
  if (
    state.latestAttempt?.status === "pending" ||
    state.latestAttempt?.status === "in-progress"
  ) {
    throw new Error("A lifecycle attempt is already in progress");
  }

  assertFutureExecutionDeadline(options.executionDeadline);

  const workflow = createInitialPlanExecutionState({
    plan,
    rootStep: options.rootStep,
    targetConfig: plan.target.config,
  });
  const attempt: LifecycleAttempt = {
    data: baseline.data,
    executionDeadline: options.executionDeadline,
    id: crypto.randomUUID(),
    operation: plan.operation,
    plan,
    progress: workflow.step,
    startedAt: workflow.startedAt,
    status: "pending",
  };

  await options.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: attempt,
    pendingPlan: null,
  });
  return attempt;
}

/** Resumes the failed attempt for the requested plan when it remains eligible. */
async function resumeFailedAttempt(
  options: StartLifecycleAttemptOptions,
  state: OrchestrationState,
): Promise<LifecycleAttempt | null> {
  const failedAttempt = state.latestAttempt;
  if (
    failedAttempt?.status !== "failed" ||
    failedAttempt.plan.id !== options.planId ||
    failedAttempt.plan.actionVersion !== options.actionVersion
  ) {
    return null;
  }

  assertFutureExecutionDeadline(options.executionDeadline);
  const { failure: _failure, ...attempt } = failedAttempt;
  const resumed: LifecycleAttempt = {
    ...attempt,
    executionDeadline: options.executionDeadline,
    status: "pending",
  };
  await options.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: resumed,
  });
  return resumed;
}

/** Rejects an execution deadline that has already elapsed. */
function assertFutureExecutionDeadline(executionDeadline: string): void {
  if (Date.parse(executionDeadline) <= Date.now()) {
    throw new Error("Execution deadline is in the past or has already elapsed");
  }
}
