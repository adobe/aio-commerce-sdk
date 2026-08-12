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

import type { AppStateSnapshot } from "#management/common/orchestration";
import type { LifecycleBaselineProvider, LifecycleStore } from "./state";

/** Source temporarily used to establish whether a compatible app is installed. */
export type CompatibilityBaselineSource = {
  get: () => Promise<AppStateSnapshot | null>;
};

/**
 * Resolves lifecycle snapshots only while the compatibility source remains
 * authoritative for an installed app.
 */
export function createLifecycleBaselineProvider(
  snapshotStore: LifecycleStore<AppStateSnapshot>,
  compatibilitySource: CompatibilityBaselineSource,
): LifecycleBaselineProvider {
  return {
    get: async (snapshotId) => {
      const compatibilityBaseline = await compatibilitySource.get();
      if (!compatibilityBaseline) {
        return null;
      }

      return snapshotId ? snapshotStore.get(snapshotId) : compatibilityBaseline;
    },
  };
}
