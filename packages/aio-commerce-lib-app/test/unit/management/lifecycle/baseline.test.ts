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

import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import { minimalValidConfig } from "#test/fixtures/config";

import type { AppStateSnapshot } from "#management/common/orchestration";

const compatibilityBaseline: AppStateSnapshot = {
  config: minimalValidConfig,
  data: null,
  id: "installation-snapshot",
};
const lifecycleBaseline: AppStateSnapshot = {
  config: {
    ...minimalValidConfig,
    metadata: { ...minimalValidConfig.metadata, version: "2.0.0" },
  },
  data: null,
  id: "lifecycle-snapshot",
};

describe("createLifecycleBaselineProvider", () => {
  test("does not return a stale lifecycle snapshot when the app is no longer installed", async () => {
    const snapshotGet = vi.fn().mockResolvedValue(lifecycleBaseline);
    const provider = createLifecycleBaselineProvider(
      { get: snapshotGet, put: vi.fn() },
      { get: vi.fn().mockResolvedValue(null) },
    );

    await expect(provider.get(lifecycleBaseline.id)).resolves.toBeNull();
    expect(snapshotGet).not.toHaveBeenCalled();
  });

  test("uses the compatibility baseline to initialize lifecycle state", async () => {
    const provider = createLifecycleBaselineProvider(
      { get: vi.fn(), put: vi.fn() },
      { get: vi.fn().mockResolvedValue(compatibilityBaseline) },
    );

    await expect(provider.get(null)).resolves.toBe(compatibilityBaseline);
  });

  test("uses the persisted lifecycle snapshot after initialization", async () => {
    const snapshotGet = vi.fn().mockResolvedValue(lifecycleBaseline);
    const provider = createLifecycleBaselineProvider(
      { get: snapshotGet, put: vi.fn() },
      { get: vi.fn().mockResolvedValue(compatibilityBaseline) },
    );

    await expect(provider.get(lifecycleBaseline.id)).resolves.toBe(
      lifecycleBaseline,
    );
    expect(snapshotGet).toHaveBeenCalledWith(lifecycleBaseline.id);
  });
});
