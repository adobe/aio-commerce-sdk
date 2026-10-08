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

import { describe, expect, test } from "vitest";

import { migrateLegacyInstallationState } from "#management/deprecated/migration";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockFailedState,
  createMockInProgressState,
  createMockInstallationStore,
  createMockSucceededState,
} from "#test/fixtures/installation";
import {
  createMockLifecycleStore,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";

import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";
import type { WorkflowRunState } from "#management/common/workflow/types";

const legacySucceededState = createMockSucceededState({
  config: minimalValidConfig,
  data: { installation: { done: true } },
  id: "legacy-installation-1",
});

function createStores(options?: {
  legacyState?: WorkflowRunState | null;
  lifecycleState?: OrchestrationState;
}) {
  return {
    installationStore: createMockInstallationStore(
      options?.legacyState ?? null,
    ),
    snapshotStore: createMockLifecycleStore<AppStateSnapshot>(),
    stateStore: createMockLifecycleStore<OrchestrationState>({
      initial: options?.lifecycleState,
    }),
  };
}

describe("migrateLegacyInstallationState", () => {
  test("seeds lifecycle state from a succeeded legacy installation", async () => {
    const stores = createStores({ legacyState: legacySucceededState });
    await migrateLegacyInstallationState(stores);

    expect(await stores.snapshotStore.get(legacySucceededState.id)).toEqual({
      config: legacySucceededState.config,
      createdAt: legacySucceededState.completedAt,
      data: legacySucceededState.data,
      id: legacySucceededState.id,
    });

    expect(await stores.stateStore.get(CURRENT_STATE_KEY)).toEqual({
      baselineSnapshotId: legacySucceededState.id,
      latestAttempt: null,
      pendingPlan: null,
    });
  });

  test("leaves existing lifecycle state untouched", async () => {
    const lifecycleState = createMockOrchestrationState({
      baselineSnapshotId: "lifecycle-snapshot",
    });

    const stores = createStores({
      legacyState: legacySucceededState,
      lifecycleState,
    });

    await migrateLegacyInstallationState(stores);

    expect(stores.snapshotStore.put).not.toHaveBeenCalled();
    expect(stores.stateStore.put).not.toHaveBeenCalled();
    expect(await stores.stateStore.get(CURRENT_STATE_KEY)).toBe(lifecycleState);
  });

  test("ignores a succeeded legacy installation that recorded no config", async () => {
    const stores = createStores({
      legacyState: createMockSucceededState({ config: undefined }),
    });

    await migrateLegacyInstallationState(stores);

    expect(stores.snapshotStore.put).not.toHaveBeenCalled();
    expect(stores.stateStore.put).not.toHaveBeenCalled();
  });

  test("ignores a failed legacy installation", async () => {
    const stores = createStores({
      legacyState: createMockFailedState({ config: minimalValidConfig }),
    });

    await migrateLegacyInstallationState(stores);

    expect(stores.snapshotStore.put).not.toHaveBeenCalled();
    expect(stores.stateStore.put).not.toHaveBeenCalled();
  });

  test("ignores an in-progress legacy installation", async () => {
    const stores = createStores({
      legacyState: createMockInProgressState({ config: minimalValidConfig }),
    });

    await migrateLegacyInstallationState(stores);

    expect(stores.snapshotStore.put).not.toHaveBeenCalled();
    expect(stores.stateStore.put).not.toHaveBeenCalled();
  });

  test("does nothing when there is no legacy installation", async () => {
    const stores = createStores();
    await migrateLegacyInstallationState(stores);

    expect(stores.snapshotStore.put).not.toHaveBeenCalled();
    expect(stores.stateStore.put).not.toHaveBeenCalled();
    expect(await stores.stateStore.get(CURRENT_STATE_KEY)).toBeNull();
  });

  test("writes once when run twice", async () => {
    const stores = createStores({ legacyState: legacySucceededState });

    await migrateLegacyInstallationState(stores);
    await migrateLegacyInstallationState(stores);

    expect(stores.snapshotStore.put).toHaveBeenCalledTimes(1);
    expect(stores.stateStore.put).toHaveBeenCalledTimes(1);
  });
});
