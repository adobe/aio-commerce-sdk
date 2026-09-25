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

import { CURRENT_STATE_KEY, requireCurrentAttempt } from "./state";

import type {
  AppStateSnapshot,
  LifecycleAttempt,
  OrchestrationState,
} from "#management/common/orchestration";
import type {
  FailedWorkflowState,
  SucceededWorkflowState,
  WorkflowRunState,
} from "#management/common/workflow/types";
import type { LifecycleRuntime, LifecycleStore } from "./state";

/** Persists execution progress for the current lifecycle attempt. */
export async function persistProgress(
  stateStore: LifecycleStore<OrchestrationState>,
  attemptId: string,
  progressState: WorkflowRunState,
): Promise<void> {
  const state = await requireCurrentAttempt(stateStore, attemptId);
  const current = state.latestAttempt as LifecycleAttempt;

  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: {
      ...current,
      data: progressState.data,
      progress: progressState.step,
      status: "in-progress",
    },
  });
}

/** Persists an apply failure as the attempt's terminal result. */
export async function persistApplyFailure(
  stateStore: LifecycleStore<OrchestrationState>,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  workflow: FailedWorkflowState,
): Promise<LifecycleAttempt> {
  const failed: LifecycleAttempt = {
    ...attempt,
    data: workflow.data,
    failure: {
      key: workflow.error.key,
      message: workflow.error.message,
      path: workflow.error.path,
      payload:
        workflow.error.payload && typeof workflow.error.payload === "object"
          ? workflow.error.payload
          : undefined,
    },
    progress: workflow.step,
    status: "failed",
  };

  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: failed,
  });

  return failed;
}

/**
 * Persists the terminal attempt state: a new baseline snapshot for an
 * operation that leaves the app installed, or the removal of the orchestration
 * state and its snapshots for a successful uninstall.
 */
export async function persistSuccess(
  stores: Pick<LifecycleRuntime, "snapshotStore" | "stateStore">,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  workflow: SucceededWorkflowState,
): Promise<LifecycleAttempt> {
  const { target } = attempt.plan;
  if (attempt.plan.operation === "uninstall" || !target) {
    return clearLifecycleState(stores, state, attempt, workflow);
  }

  const snapshot: AppStateSnapshot = {
    config: target.config,
    createdAt: workflow.completedAt,
    data: workflow.data,
    id: crypto.randomUUID(),
  };

  await stores.snapshotStore.put(snapshot.id, snapshot);
  const succeeded: LifecycleAttempt = {
    ...attempt,
    data: workflow.data,
    progress: workflow.step,
    result: {
      appVersion: target.appVersion,
      snapshotId: snapshot.id,
    },
    status: "succeeded",
  };

  await stores.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    baselineSnapshotId: snapshot.id,
    latestAttempt: succeeded,
  });

  return succeeded;
}

/**
 * Removes the orchestration state and the snapshots it referenced, and returns
 * the terminal attempt of the uninstall that emptied them.
 */
async function clearLifecycleState(
  stores: Pick<LifecycleRuntime, "snapshotStore" | "stateStore">,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  workflow: SucceededWorkflowState,
): Promise<LifecycleAttempt> {
  const { source } = attempt.plan;

  // Drop the state first: a failed snapshot deletion then only leaks storage,
  // instead of leaving state pointing at a snapshot that no longer exists.
  await stores.stateStore.delete(CURRENT_STATE_KEY);

  const snapshotIds = new Set(
    [state.baselineSnapshotId, source?.snapshotId].filter(
      (id): id is string => typeof id === "string",
    ),
  );

  await Promise.all(
    [...snapshotIds].map((id) => stores.snapshotStore.delete(id)),
  );

  return {
    ...attempt,
    data: workflow.data,
    progress: workflow.step,

    // Nothing was captured, so the result can only name the state torn down.
    result: {
      appVersion: source?.appVersion ?? "0.0.0",
      snapshotId: source?.snapshotId ?? "",
    },
    status: "succeeded",
  };
}
