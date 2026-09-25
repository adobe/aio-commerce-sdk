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

import { putAttempt, requireActiveAttempt, updateLatestAttempt } from "./state";

import type {
  AppStateSnapshot,
  LifecycleAttempt,
} from "#management/common/orchestration";
import type {
  FailedWorkflowState,
  SucceededWorkflowState,
  WorkflowRunState,
} from "#management/common/workflow/types";
import type { LifecycleRuntime } from "./state";

/** Stores shared by the persistence writers. */
type PersistStores = Pick<LifecycleRuntime, "stateStore" | "attemptStore">;

/** Persists execution progress for the lifecycle attempt addressed by id. */
export async function persistProgress(
  stores: PersistStores,
  attemptId: string,
  progressState: WorkflowRunState,
): Promise<void> {
  const current = await requireActiveAttempt(stores.attemptStore, attemptId);
  const updated: LifecycleAttempt = {
    ...current,
    data: progressState.data,
    progress: progressState.step,
    status: "in-progress",
  };

  await putAttempt(stores.attemptStore, updated);
  await updateLatestAttempt(stores.stateStore, updated);
}

/** Persists an apply failure as the attempt's terminal result. */
export async function persistApplyFailure(
  stores: PersistStores,
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

  await putAttempt(stores.attemptStore, failed);
  await updateLatestAttempt(stores.stateStore, failed);

  return failed;
}

/** Persists the successful snapshot and terminal attempt state. */
export async function persistSuccess(
  stores: Pick<
    LifecycleRuntime,
    "snapshotStore" | "stateStore" | "attemptStore"
  >,
  attempt: LifecycleAttempt,
  workflow: SucceededWorkflowState,
): Promise<LifecycleAttempt> {
  const snapshot: AppStateSnapshot = {
    config: attempt.plan.target.config,
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
      appVersion: attempt.plan.target.appVersion,
      snapshotId: snapshot.id,
    },
    status: "succeeded",
  };

  await putAttempt(stores.attemptStore, succeeded);
  await updateLatestAttempt(stores.stateStore, succeeded, {
    baselineSnapshotId: snapshot.id,
  });

  return succeeded;
}
