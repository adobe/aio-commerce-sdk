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
  SYSTEM_NAMESPACE,
} from "./configuration-repository";

// Matches `aio-lib-state`'s own default TTL, which the system config previously
// relied on by omitting the TTL; set explicitly here since `persistConfig`
// always passes one through.
const SYSTEM_CONFIG_CACHE_TTL_SECONDS = 86_400;

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
 */
export async function setSystemConfigByKey(
  key: string,
  value: unknown | null,
): Promise<void> {
  if (value === null || value === undefined) {
    await deleteConfig(key, SYSTEM_NAMESPACE);
    return;
  }

  await persistConfig(
    key,
    value,
    SYSTEM_CONFIG_CACHE_TTL_SECONDS,
    SYSTEM_NAMESPACE,
  );
}

/**
 * Retrieves a system configuration value by key.
 *
 * Reads from the `aio-lib-state` cache first, falling back to `aio-lib-files`
 * and re-caching. Returns `null` when the key is not found in either layer.
 *
 * @param key - The system configuration key (e.g. `"system.association"`).
 * @returns The stored value cast to `T`, or `null` if not found.
 */
export async function getSystemConfigByKey<T>(key: string): Promise<T | null> {
  return (await loadConfig(
    key,
    SYSTEM_CONFIG_CACHE_TTL_SECONDS,
    SYSTEM_NAMESPACE,
  )) as T | null;
}
