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
import type { KeyValueStore, StateStoreOptions } from "./types";

/** Default TTL for state entries (3 hours in seconds). */
const DEFAULT_TTL_SECONDS = 3 * 60 * 60;

/** Default key prefix. */
const DEFAULT_KEY_PREFIX = "store";

/**
 * Creates a generic key-value store backed by @adobe/aio-lib-state.
 * Provides fast, TTL-based caching for temporary data.
 *
 * @typeParam T - The type of data to store.
 * @param options - Configuration options for the store.
 * @returns A KeyValueStore implementation.
 *
 * @example
 * ```typescript
 * interface UserSession {
 *   userId: string;
 *   token: string;
 * }
 *
 * const store = await createStateStore<UserSession>({
 *   keyPrefix: "session",
 *   ttlSeconds: 3600, // 1 hour
 * });
 *
 * await store.put("user-123", { userId: "123", token: "abc" });
 * const session = await store.get("user-123");
 * ```
 */
export async function createStateStore<T>(
  options: StateStoreOptions = {},
): Promise<KeyValueStore<T>> {
  const { keyPrefix = DEFAULT_KEY_PREFIX, ttlSeconds = DEFAULT_TTL_SECONDS } =
    options;

  const state = await initState();
  return new StateStore<T>(state, keyPrefix, ttlSeconds);
}

/**
 * Key-value store implementation using @adobe/aio-lib-state.
 */
class StateStore<T> implements KeyValueStore<T> {
  private readonly state: AdobeState;
  private readonly keyPrefix: string;
  private readonly ttlSeconds: number;

  public constructor(state: AdobeState, keyPrefix: string, ttlSeconds: number) {
    this.state = state;
    this.keyPrefix = keyPrefix;
    this.ttlSeconds = ttlSeconds;
  }

  public async get(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const result = await this.state.get(fullKey);

    if (!result?.value) {
      return null;
    }

    try {
      return JSON.parse(result.value) as T;
    } catch {
      return null;
    }
  }

  public async put(key: string, data: T): Promise<void> {
    const fullKey = this.buildKey(key);
    const value = JSON.stringify(data);

    await this.state.put(fullKey, value, { ttl: this.ttlSeconds });
  }

  public async delete(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);

    try {
      await this.state.delete(fullKey);
      return true;
    } catch {
      return false;
    }
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}-${key}`;
  }
}
