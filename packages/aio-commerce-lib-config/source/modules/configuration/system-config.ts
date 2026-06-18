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

import {
  deleteConfig,
  loadConfig,
  persistConfig,
} from "./configuration-repository";

import type { RepositoryNamespace } from "./configuration-repository";

// Matches `aio-lib-state`'s own default TTL, which the system config previously
// relied on by omitting the TTL; set explicitly here since `persistConfig`
// always passes one through.
const SYSTEM_CONFIG_CACHE_TTL_SECONDS = 86_400;

/**
 * Storage layout for SDK-managed system config. The key already carries the
 * `system.` prefix (e.g. `system.association`), so it doubles as the cache key
 * and keeps these entries cleanly separated from `configuration.*`.
 */
const SYSTEM_NAMESPACE: RepositoryNamespace = {
  stateKey: (key) => key,
  filePath: (key) => `system/${key}.json`,
};

/**
 * Stores or clears a system configuration value by key.
 *
 * Persists the value to `aio-lib-files` (source of truth) and caches it in
 * `aio-lib-state`. Passing `null` or `undefined` clears the entry from both
 * storage layers. System config is stored under the `system.*` namespace,
 * separate from scope-keyed Business Configuration.
 *
 * @param key - The system configuration key (e.g. `"system.association"`).
 * @param value - The value to store, or `null`/`undefined` to clear the entry.
 * @param ttlSeconds - Cache TTL in seconds for the `aio-lib-state` entry.
 *   Defaults to 24 hours; `aio-lib-state` caps it at one year (31536000s).
 */
export async function setSystemConfigByKey(
  key: string,
  value: unknown | null,
  ttlSeconds: number = SYSTEM_CONFIG_CACHE_TTL_SECONDS,
): Promise<void> {
  if (value === null || value === undefined) {
    await deleteConfig(key, SYSTEM_NAMESPACE);
    return;
  }

  await persistConfig(key, value, ttlSeconds, SYSTEM_NAMESPACE);
}

/**
 * Retrieves a system configuration value by key.
 *
 * Reads from the `aio-lib-state` cache first, falling back to `aio-lib-files`
 * and re-caching. Returns `null` when the key is not found in either layer.
 *
 * @param key - The system configuration key (e.g. `"system.association"`).
 * @param ttlSeconds - Cache TTL in seconds applied when re-caching a value
 *   read from `aio-lib-files`. Defaults to 24 hours; `aio-lib-state` caps it
 *   at one year (31536000s).
 * @returns The stored value cast to `T`, or `null` if not found.
 */
export async function getSystemConfigByKey<T = unknown>(
  key: string,
  ttlSeconds: number = SYSTEM_CONFIG_CACHE_TTL_SECONDS,
): Promise<T | null> {
  return (await loadConfig(key, ttlSeconds, SYSTEM_NAMESPACE)) as T | null;
}
