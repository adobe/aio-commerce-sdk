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
import type { CleanupResource } from "#management/common/workflow/resource";
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
  resolvedCleanupResources: CleanupResource[],
): Promise<void> {
  const state = await requireCurrentAttempt(stateStore, attemptId);
  const current = state.latestAttempt as LifecycleAttempt;
  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: {
      ...current,
      data: progressState.data,
      progress: progressState.step,
      resolvedCleanupResources,
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
  resolvedCleanupResources: CleanupResource[],
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
    resolvedCleanupResources,
    status: "failed",
  };
  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: failed,
  });
  return failed;
}

/** Persists a failure when planned execution leaves cleanup unresolved. */
export async function persistCleanupFailure(
  stateStore: LifecycleStore<OrchestrationState>,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  workflow: SucceededWorkflowState,
  resolvedCleanupResources: CleanupResource[],
): Promise<LifecycleAttempt> {
  const failed: LifecycleAttempt = {
    ...attempt,
    data: workflow.data,
    failure: {
      key: "LIFECYCLE_CLEANUP_UNRESOLVED",
      message: "The lifecycle plan did not resolve every cleanup resource",
      path: [],
    },
    progress: workflow.step,
    resolvedCleanupResources,
    status: "failed",
  };
  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: failed,
  });
  return failed;
}

/** Persists the successful snapshot and terminal attempt state. */
export async function persistSuccess(
  stores: Pick<LifecycleRuntime, "snapshotStore" | "stateStore">,
  state: OrchestrationState,
  attempt: LifecycleAttempt,
  workflow: SucceededWorkflowState,
  resolvedCleanupResources: CleanupResource[],
  remainingCleanupResources: CleanupResource[],
): Promise<LifecycleAttempt> {
  const snapshot: AppStateSnapshot = {
    config: attempt.plan.target.config,
    data: workflow.data,
    id: crypto.randomUUID(),
  };
  await stores.snapshotStore.put(snapshot.id, snapshot);
  const succeeded: LifecycleAttempt = {
    ...attempt,
    data: workflow.data,
    progress: workflow.step,
    resolvedCleanupResources,
    result: {
      appVersion: attempt.plan.target.appVersion,
      snapshotId: snapshot.id,
    },
    status: "succeeded",
  };
  await stores.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    baselineSnapshotId: snapshot.id,
    latestAttempt: succeeded,
    unresolvedCleanupResources: remainingCleanupResources,
  });
  return succeeded;
}
