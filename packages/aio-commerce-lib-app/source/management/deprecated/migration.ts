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

import { isSucceededState } from "#management/index";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";

import { getStorageKey } from "./stores";

import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";
import type { WorkflowRunState } from "#management/common/workflow/types";
import type { LifecycleStore } from "#management/lifecycle/state";

/** Stores read and written while migrating legacy installation state. */
export type LegacyMigrationStores = {
  installationStore: Pick<KeyValueStore<WorkflowRunState>, "get">;
  snapshotStore: LifecycleStore<AppStateSnapshot>;
  stateStore: LifecycleStore<OrchestrationState>;
};

/**
 * Projects a legacy installation record into an app-state snapshot, or returns
 * null when it is not authoritative (no install, an in-progress or failed
 * install, or a record persisted before the config was recorded).
 */
function toAppStateSnapshot(
  state: WorkflowRunState | null,
): AppStateSnapshot | null {
  if (!(state && isSucceededState(state) && state.config)) {
    return null;
  }

  return {
    config: state.config,
    createdAt: state.completedAt,
    data: state.data,
    id: state.id,
  };
}

/**
 * Seeds lifecycle state from a successful pre-lifecycle installation, once.
 * Does nothing when lifecycle state already exists or when the legacy record
 * carries no usable baseline.
 */
export async function migrateLegacyInstallationState(
  stores: LegacyMigrationStores,
): Promise<void> {
  if (await stores.stateStore.get(CURRENT_STATE_KEY)) {
    return;
  }

  const legacyState = await stores.installationStore.get(getStorageKey());
  const snapshot = toAppStateSnapshot(legacyState);
  if (!snapshot) {
    return;
  }

  await stores.snapshotStore.put(snapshot.id, snapshot);
  await stores.stateStore.put(CURRENT_STATE_KEY, {
    baselineSnapshotId: snapshot.id,

    // A legacy run never produced a lifecycle plan, and an attempt requires one.
    latestAttempt: null,
    pendingPlan: null,
  });
}
