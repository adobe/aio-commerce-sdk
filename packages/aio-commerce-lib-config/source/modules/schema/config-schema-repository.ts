/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { getLogger } from "#utils/logger";
import { getSharedFiles, getSharedState } from "#utils/repository";

import type { BusinessConfigSchema } from "./types";

/**
 * Gets cached schema from state store.
 *
 * @param namespace - Namespace identifier for the schema.
 * @returns Promise resolving to cached schema or null if not found.
 */
export async function getCachedSchema(
  namespace: string,
): Promise<BusinessConfigSchema | null> {
  try {
    const state = await getSharedState();
    const cached = await state.get(`${namespace}:config-schema`);
    if (cached?.value) {
      const parsed = JSON.parse(cached.value);
      return parsed.data || null;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

/**
 * Caches schema in state store with TTL.
 *
 * @param namespace - Namespace identifier for the schema.
 * @param data - Schema data to cache.
 * @param ttl - Time to live in milliseconds.
 */
export async function setCachedSchema(
  namespace: string,
  data: BusinessConfigSchema,
  ttl: number,
): Promise<void> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:config-schema-repository",
  );
  try {
    const state = await getSharedState();
    await state.put(`${namespace}:config-schema`, JSON.stringify({ data }), {
      ttl,
    });
  } catch (error) {
    logger.debug(
      "Failed to cache schema:",
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - caching failure shouldn't break functionality
  }
}

/**
 * Deletes cached schema from state store.
 *
 * @param namespace - Namespace identifier for the schema.
 */
export async function deleteCachedSchema(namespace: string): Promise<void> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:config-schema-repository",
  );
  try {
    const state = await getSharedState();
    await state.delete(`${namespace}:config-schema`);
  } catch (error) {
    logger.debug(
      "Failed to delete cached schema:",
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - cache deletion failure shouldn't break functionality
  }
}

/**
 * Gets cached schema version.
 *
 * @param namespace - Namespace identifier for the schema.
 * @returns Promise resolving to schema version hash or null if not found.
 */
export async function getSchemaVersion(
  namespace: string,
): Promise<string | null> {
  try {
    const state = await getSharedState();
    const versionData = await state.get(`${namespace}:schema-version`);
    if (versionData?.value) {
      const parsed = JSON.parse(versionData.value);
      return parsed.version || null;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

/**
 * Sets schema version.
 *
 * @param namespace - Namespace identifier for the schema.
 * @param version - Schema version hash to store.
 */
export async function setSchemaVersion(
  namespace: string,
  version: string,
): Promise<void> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:config-schema-repository",
  );
  try {
    const state = await getSharedState();
    await state.put(`${namespace}:schema-version`, JSON.stringify({ version }));
  } catch (error) {
    logger.debug(
      "Failed to set schema version:",
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - version tracking failure shouldn't break functionality
  }
}

/**
 * Reads persisted schema from files.
 *
 * @returns Promise resolving to schema content as JSON string.
 */
export async function getPersistedSchema(): Promise<string> {
  const files = await getSharedFiles();
  const buffer: Buffer = await files.read("config-schema.json");
  return buffer.toString();
}

/**
 * Saves schema to files.
 *
 * @param schema - Schema content as JSON string.
 */
export async function saveSchema(schema: string): Promise<void> {
  const files = await getSharedFiles();
  await files.write("config-schema.json", schema);
}
