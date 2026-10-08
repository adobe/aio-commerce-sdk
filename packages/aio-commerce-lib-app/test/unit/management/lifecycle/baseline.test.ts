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

import { describe, expect, test, vi } from "vitest";

import {
  createLifecycleBaselineProvider,
  getCurrentLifecycleBaseline,
} from "#management/lifecycle/baseline";
import { minimalValidConfig } from "#test/fixtures/config";
import { createMockInstallationStore } from "#test/fixtures/installation";
import { createMockLifecycleStore } from "#test/fixtures/lifecycle";

import type { AppStateSnapshot } from "#management/common/orchestration";

const lifecycleBaseline: AppStateSnapshot = {
  config: {
    ...minimalValidConfig,
    metadata: { ...minimalValidConfig.metadata, version: "2.0.0" },
  },
  createdAt: "2026-08-12T09:00:00.000Z",
  data: null,
  id: "lifecycle-snapshot",
};

describe("createLifecycleBaselineProvider", () => {
  test("resolves the requested lifecycle snapshot", async () => {
    const snapshotGet = vi.fn().mockResolvedValue(lifecycleBaseline);
    const provider = createLifecycleBaselineProvider({
      get: snapshotGet,
      put: vi.fn(),
    });

    await expect(provider.get(lifecycleBaseline.id)).resolves.toBe(
      lifecycleBaseline,
    );
    expect(snapshotGet).toHaveBeenCalledWith(lifecycleBaseline.id);
  });

  test("resolves to null when there is no baseline snapshot id", async () => {
    const snapshotGet = vi.fn();
    const provider = createLifecycleBaselineProvider({
      get: snapshotGet,
      put: vi.fn(),
    });

    await expect(provider.get(null)).resolves.toBeNull();
    expect(snapshotGet).not.toHaveBeenCalled();
  });

  test("resolves a lifecycle snapshot even when the legacy store is empty", async () => {
    const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    await snapshotStore.put(lifecycleBaseline.id, lifecycleBaseline);
    const legacyStore = createMockInstallationStore();

    const provider = createLifecycleBaselineProvider(snapshotStore);

    await expect(provider.get(lifecycleBaseline.id)).resolves.toEqual(
      lifecycleBaseline,
    );
    expect(await legacyStore.get("current")).toBeNull();
  });
});

describe("getCurrentLifecycleBaseline", () => {
  test("uses the lifecycle snapshot selected by orchestration state", async () => {
    const providerGet = vi.fn().mockResolvedValue(lifecycleBaseline);

    await expect(
      getCurrentLifecycleBaseline(
        {
          get: vi.fn().mockResolvedValue({
            baselineSnapshotId: lifecycleBaseline.id,
          }),
          put: vi.fn(),
        },
        { get: providerGet },
      ),
    ).resolves.toBe(lifecycleBaseline);
    expect(providerGet).toHaveBeenCalledWith(lifecycleBaseline.id);
  });

  test("resolves to no baseline before lifecycle state exists", async () => {
    const providerGet = vi.fn().mockResolvedValue(null);

    await expect(
      getCurrentLifecycleBaseline(
        { get: vi.fn().mockResolvedValue(null), put: vi.fn() },
        { get: providerGet },
      ),
    ).resolves.toBeNull();
    expect(providerGet).toHaveBeenCalledWith(null);
  });
});
