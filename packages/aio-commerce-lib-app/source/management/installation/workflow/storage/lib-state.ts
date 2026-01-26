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

import { init as initState } from "@adobe/aio-lib-state";

import type { AdobeState } from "@adobe/aio-lib-state";
import type { InstallationState, InstallationStateStore } from "../types";

/** Key prefix for installation state entries. */
const STATE_KEY_PREFIX = "installation";

/** Default TTL for installation state (3 hours in seconds). */
const DEFAULT_TTL_SECONDS = 3 * 60 * 60;

/** Options for creating a lib-state based store. */
export type LibStateStoreOptions = {
  ttlSeconds?: number;
};

/**
 * Creates an installation state store backed by @adobe/aio-lib-state.
 *
 * @param options - Configuration options for the store.
 * @returns An InstallationStateStore implementation.
 *
 * @example
 * ```typescript
 * const store = await createLibStateStore();
 *
 * // Use with runInstallation
 * const result = await runInstallation({
 *   installationContext,
 *   config,
 *   phases: [eventsPhase, webhooksPhase],
 *   store,
 * });
 * ```
 */
export async function createLibStateStore(
  options: LibStateStoreOptions = {},
): Promise<InstallationStateStore> {
  const { ttlSeconds = DEFAULT_TTL_SECONDS } = options;
  const state = await initState();

  return new LibStateStore(state, ttlSeconds);
}

/**
 * Installation state store implementation using @adobe/aio-lib-state.
 */
class LibStateStore implements InstallationStateStore {
  private readonly state: AdobeState;
  private readonly ttlSeconds: number;

  public constructor(state: AdobeState, ttlSeconds: number) {
    this.state = state;
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Retrieves installation state by ID.
   *
   * @param installationId - The installation ID to retrieve.
   * @returns The installation state or null if not found.
   */
  public async get(installationId: string): Promise<InstallationState | null> {
    const key = this.buildKey(installationId);
    const result = await this.state.get(key);

    if (!result.value) {
      return null;
    }

    try {
      return JSON.parse(result.value) as InstallationState;
    } catch {
      return null;
    }
  }

  /**
   * Saves installation state.
   *
   * @param state - The installation state to save.
   */
  public async save(state: InstallationState): Promise<void> {
    const key = this.buildKey(state.installationId);
    const value = JSON.stringify(state);

    await this.state.put(key, value, { ttl: this.ttlSeconds });
  }

  /**
   * Builds the state key for an installation ID.
   */
  private buildKey(installationId: string): string {
    return `${STATE_KEY_PREFIX}:${installationId}`;
  }
}
