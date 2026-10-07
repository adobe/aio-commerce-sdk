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
  LifecycleAttempt,
  LifecyclePlan,
  OrchestrationState,
} from "#management/common/orchestration";

const ORCHESTRATION_STATE_PREFIX = "lifecycle-orchestration-state";
const APP_STATE_SNAPSHOT_PREFIX = "lifecycle-app-state-snapshot";
const LIFECYCLE_ATTEMPT_PREFIX = "lifecycle-attempt";
const LIFECYCLE_PLAN_PREFIX = "lifecycle-plan";

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

/** Creates the store for attempts that are no longer the latest, keyed by attempt id. */
export function createLifecycleAttemptStore() {
  return createCombinedStore<LifecycleAttempt>({
    cache: { keyPrefix: LIFECYCLE_ATTEMPT_PREFIX },
    persistent: {
      dirPrefix: LIFECYCLE_ATTEMPT_PREFIX,
      shouldPersist: () => true,
    },
  });
}

/** Creates the store for every lifecycle plan ever made, keyed by plan id. */
export function createLifecyclePlanStore() {
  return createCombinedStore<LifecyclePlan>({
    cache: { keyPrefix: LIFECYCLE_PLAN_PREFIX },
    persistent: {
      dirPrefix: LIFECYCLE_PLAN_PREFIX,
      shouldPersist: () => true,
    },
  });
}
