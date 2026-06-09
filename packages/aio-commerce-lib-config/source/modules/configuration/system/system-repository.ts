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

import stringify from "safe-stable-stringify";

import { getLogger } from "#utils/logger";
import { getSharedFiles, getSharedState } from "#utils/repository";

const SYSTEM_FILES_PREFIX = "system/";

function getSystemFilePath(key: string): string {
  return `${SYSTEM_FILES_PREFIX}${key}.json`;
}

async function readFromCache(key: string): Promise<string | null> {
  try {
    const state = await getSharedState();
    const result = await state.get(key);
    return result?.value ?? null;
  } catch {
    return null;
  }
}

async function writeToCache(key: string, payload: string): Promise<void> {
  const logger = getLogger("@adobe/aio-commerce-lib-config:system-repository");
  try {
    const state = await getSharedState();
    await state.put(key, payload);
  } catch (error) {
    logger.debug(
      "Failed to cache system config:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function deleteFromCache(key: string): Promise<void> {
  const logger = getLogger("@adobe/aio-commerce-lib-config:system-repository");
  try {
    const state = await getSharedState();
    await state.delete(key);
  } catch (error) {
    logger.debug(
      "Failed to clear system config cache:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function readFromFiles(key: string): Promise<string | null> {
  try {
    const files = await getSharedFiles();
    const filePath = getSystemFilePath(key);
    const filesList = await files.list(SYSTEM_FILES_PREFIX);
    const fileObject = filesList.find((file) => file.name === filePath);

    if (!fileObject) {
      return null;
    }

    const content = await files.read(filePath);
    return content ? content.toString("utf8") : null;
  } catch {
    return null;
  }
}

async function writeToFiles(key: string, payload: string): Promise<void> {
  const files = await getSharedFiles();
  const filePath = getSystemFilePath(key);
  await files.write(filePath, payload);
}

async function deleteFromFiles(key: string): Promise<void> {
  const logger = getLogger("@adobe/aio-commerce-lib-config:system-repository");
  try {
    const files = await getSharedFiles();
    const filePath = getSystemFilePath(key);
    await files.delete(filePath);
  } catch (error) {
    logger.debug(
      "Failed to delete system config file:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Stores or clears a system configuration value by key.
 *
 * Persists the value to `aio-lib-files` (source of truth) and writes it to
 * `aio-lib-state` as a performance cache. Passing `null` clears the entry from
 * both storage layers.
 *
 * @param key - The system configuration key (e.g. `"system.association"`).
 * @param value - The value to store, or `null` to clear the entry.
 */
export async function setSystemConfigByKey(
  key: string,
  value: unknown | null,
): Promise<void> {
  if (value === null) {
    await deleteFromFiles(key);
    await deleteFromCache(key);
    return;
  }

  const payload = stringify(value) as string;
  await writeToFiles(key, payload);
  await writeToCache(key, payload);
}

/**
 * Retrieves a system configuration value by key.
 *
 * Reads from the `aio-lib-state` cache first; on cache miss, falls back to
 * `aio-lib-files` (the persistent source of truth) and re-caches the value for
 * subsequent reads. Returns `null` when the key is not found in either layer.
 *
 * @param key - The system configuration key (e.g. `"system.association"`).
 * @returns The stored value cast to `T`, or `null` if not found.
 */
export async function getSystemConfigByKey<T>(key: string): Promise<T | null> {
  const cached = await readFromCache(key);
  if (cached !== null) {
    return JSON.parse(cached) as T;
  }

  const persisted = await readFromFiles(key);
  if (persisted === null) {
    return null;
  }

  // Re-cache for subsequent reads
  await writeToCache(key, persisted);
  return JSON.parse(persisted) as T;
}
