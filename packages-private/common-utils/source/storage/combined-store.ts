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

import { createFilesStore } from "./files-store";
import { createStateStore } from "./state-store";

import type { CombinedStoreOptions, KeyValueStore } from "./types";

/** Default TTL for cache (10 minutes). */
const DEFAULT_CACHE_TTL_SECONDS = 10 * 60;

/**
 * Creates a combined key-value store that uses:
 * - lib-state for fast cache during active operations
 * - lib-files for persistent storage
 *
 * Read strategy: cache first, then persistent storage
 * Write strategy:
 * - Always write to cache for fast reads
 * - Write to persistent storage based on shouldPersist predicate
 *
 * @typeParam T - The type of data to store.
 * @param options - Configuration options for the stores.
 *
 * @example
 * ```typescript
 * interface Task {
 *   id: string;
 *   status: "pending" | "completed";
 *   result?: unknown;
 * }
 *
 * const store = await createCombinedStore<Task>({
 *   cache: { keyPrefix: "task", ttlSeconds: 600 },
 *   persistent: {
 *     dirPrefix: "tasks",
 *     shouldPersist: (task) => task.status === "completed",
 *   },
 * });
 *
 * // During processing: writes to cache only
 * await store.put("task-1", { id: "1", status: "pending" });
 *
 * // On completion (as shouldPersist indicates): writes to both cache and persistent
 * await store.put("task-1", { id: "1", status: "completed", result: {} });
 * ```
 */
export async function createCombinedStore<T>(
  options: CombinedStoreOptions<T> = {},
): Promise<KeyValueStore<T>> {
  const { cache = {}, persistent = {} } = options;
  const { shouldPersist, ...filesOptions } = persistent;

  const cacheOptions = {
    ttlSeconds: DEFAULT_CACHE_TTL_SECONDS,
    ...cache,
  };

  const [cacheStore, persistentStore] = await Promise.all([
    createStateStore<T>(cacheOptions),
    createFilesStore<T>(filesOptions),
  ]);

  return new CombinedStore<T>(cacheStore, persistentStore, shouldPersist);
}

/**
 * Combined key-value store implementation.
 * Uses lib-state for cache and lib-files for persistence.
 */
class CombinedStore<T> implements KeyValueStore<T> {
  private readonly cache: KeyValueStore<T>;
  private readonly persistent: KeyValueStore<T>;
  private readonly shouldPersist?: (data: T) => boolean;

  public constructor(
    cache: KeyValueStore<T>,
    persistent: KeyValueStore<T>,
    shouldPersist?: (data: T) => boolean,
  ) {
    this.cache = cache;
    this.persistent = persistent;
    this.shouldPersist = shouldPersist;
  }

  public async get(key: string): Promise<T | null> {
    // Try cache first (fast path)
    const cached = await this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Fall back to persistent storage
    const persisted = await this.persistent.get(key);
    if (persisted) {
      // Re-populate cache for future reads
      await this.cache.put(key, persisted).catch(() => {
        // Ignore cache write errors
      });
      return persisted;
    }

    return null;
  }

  public async put(key: string, data: T): Promise<void> {
    // Always write to cache for fast reads
    await this.cache.put(key, data);

    // Persist based on predicate (or always if no predicate)
    if (!this.shouldPersist || this.shouldPersist(data)) {
      await this.persistent.put(key, data);
    }
  }

  public async delete(key: string): Promise<boolean> {
    const [cacheDeleted, persistentDeleted] = await Promise.all([
      this.cache.delete?.(key) ?? Promise.resolve(false),
      this.persistent.delete?.(key) ?? Promise.resolve(false),
    ]);

    return cacheDeleted || persistentDeleted;
  }
}
