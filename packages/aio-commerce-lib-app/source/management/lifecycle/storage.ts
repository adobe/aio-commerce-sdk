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

import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";

import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";

const ORCHESTRATION_STATE_PREFIX = "lifecycle-orchestration-state";
const APP_STATE_SNAPSHOT_PREFIX = "lifecycle-app-state-snapshot";

/** Creates the always-persisted store for the current orchestration state. */
export function createOrchestrationStateStore() {
  return createCombinedStore<OrchestrationState>({
    cache: { keyPrefix: ORCHESTRATION_STATE_PREFIX },
    persistent: {
      dirPrefix: ORCHESTRATION_STATE_PREFIX,
      shouldPersist: () => true,
    },
  });
}

/** Creates the store for successful app-state snapshots. */
export function createAppStateSnapshotStore() {
  return createCombinedStore<AppStateSnapshot>({
    cache: { keyPrefix: APP_STATE_SNAPSHOT_PREFIX },
    persistent: {
      dirPrefix: APP_STATE_SNAPSHOT_PREFIX,
      shouldPersist: () => true,
    },
  });
}
