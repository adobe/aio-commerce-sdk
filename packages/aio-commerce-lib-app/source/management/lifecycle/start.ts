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
import { getAtPath, setAtPath } from "#management/common/workflow/utils";

import {
  BlockedLifecyclePlanError,
  InvalidStartDeadlineError,
  LifecycleAttemptInProgressError,
  LifecyclePlanActionVersionMismatchError,
  PendingLifecyclePlanNotFoundError,
} from "./errors";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
  readOrInitializeState,
} from "./state";

import type {
  AppStateSnapshot,
  LifecycleAttempt,
  LifecyclePlanDiff,
} from "#management/common/orchestration";
import type { WorkflowData } from "#management/common/workflow/types";
import type { LifecycleRuntime } from "./state";

/** Inputs used to consume a reviewed plan and create an attempt. */
export type StartLifecycleAttemptOptions = LifecycleRuntime & {
  actionVersion: string;
  executionDeadline: string;
  planId: string;

  /** Identifier of the OpenWhisk activation that starts the attempt. */
  activationId: string;

  /** How the plan differs from the one a reviewer approved, recorded on the attempt. */
  planDiff?: LifecyclePlanDiff;
};

/**
 * Creates and persists an attempt for an exact pending plan. Moves the attempt it replaces as the
 * latest to the attempt store first, so the new attempt can link to it.
 */
export async function startLifecycleAttempt(
  options: StartLifecycleAttemptOptions,
): Promise<LifecycleAttempt> {
  const loaded = await readOrInitializeState(options);
  const state = await normalizeExpiredAttempt(
    options.stateStore,
    loaded.state,
    options.lifecycleContext.logger,
  );

  const { baseline } = loaded;
  const plan = state.pendingPlan;

  if (!plan || plan.id !== options.planId) {
    throw new PendingLifecyclePlanNotFoundError(options.planId);
  }
  if (plan.actionVersion !== options.actionVersion) {
    throw new LifecyclePlanActionVersionMismatchError(plan.actionVersion);
  }

  if (plan.issues.some((issue) => issue.blocking)) {
    throw new BlockedLifecyclePlanError(plan.id);
  }

  if (
    state.latestAttempt?.status === "pending" ||
    state.latestAttempt?.status === "in-progress"
  ) {
    throw new LifecycleAttemptInProgressError();
  }

  assertFutureExecutionDeadline(options.executionDeadline);
  const workflow = createInitialPlanExecutionState({
    plan,
    rootStep: options.rootStep,
    targetConfig: plan.target?.config,
  });

  const previousAttempt = state.latestAttempt;
  const attempt: LifecycleAttempt = {
    activations: { start: options.activationId },
    data: getStartingData(
      baseline,
      previousAttempt,
      options.failedAttemptDataPaths,
    ),
    executionDeadline: options.executionDeadline,
    id: crypto.randomUUID(),
    operation: plan.operation,
    plan,
    planDiff: options.planDiff,
    previousAttemptId: previousAttempt?.id ?? null,
    progress: workflow.step,
    startedAt: workflow.startedAt,
    status: "pending",
  };

  // Archived before the state changes, so a failed write leaves the previous attempt as the latest.
  if (previousAttempt) {
    await options.attemptStore.put(previousAttempt.id, previousAttempt);
  }

  await options.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: attempt,
    pendingPlan: null,
  });

  return attempt;
}

/** Rejects an execution deadline that has already elapsed. */
function assertFutureExecutionDeadline(executionDeadline: string): void {
  const deadline = Date.parse(executionDeadline);
  if (!Number.isFinite(deadline) || deadline <= Date.now()) {
    throw new InvalidStartDeadlineError(executionDeadline);
  }
}

/**
 * The data a new attempt starts with: the baseline's, with the data at `failedAttemptDataPaths`
 * taken from the latest attempt when it failed.
 */
function getStartingData(
  baseline: AppStateSnapshot | null,
  latestAttempt: LifecycleAttempt | null,
  failedAttemptDataPaths: string[][] = [],
): WorkflowData | null {
  const failedData =
    latestAttempt?.status === "failed" ? latestAttempt.data : null;

  const paths = failedData
    ? failedAttemptDataPaths.filter(
        (path) => getAtPath(failedData, path) !== undefined,
      )
    : [];

  if (!failedData || paths.length === 0) {
    return baseline?.data ?? null;
  }

  // Copied, so taking the failed attempt's data does not change the baseline.
  const data = structuredClone(baseline?.data ?? {});
  for (const path of paths) {
    setAtPath(data, path, getAtPath(failedData, path));
  }

  return data;
}
