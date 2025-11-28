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

import * as schemaRepository from "./config-schema-repository";
import * as schemaUtils from "./utils";

import type { ConfigSchemaField, SchemaContext } from "./types";

/**
 * Gets the configuration schema with lazy initialization and version checking.
 *
 * The schema defines the structure of configuration fields available in your application,
 * including field names, types, default values, and validation rules. The schema is
 * cached and automatically updated when the bundled schema version changes.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @returns Promise resolving to an array of schema field definitions.
 */
export async function getSchema(
  context: SchemaContext,
): Promise<ConfigSchemaField[]> {
  const cachedSchema = await tryGetFromCache(context);
  if (cachedSchema) {
    return cachedSchema;
  }

  const storedSchema = await tryGetFromStorage(context);
  if (storedSchema) {
    return await handleStoredSchemaUpdate(context, storedSchema);
  }

  return await initializeSchemaFromBundledFile(context);
}

/**
 * Stores a validated schema in persistent storage and clears the cache.
 *
 * This function persists the schema to lib-files storage and invalidates the cache
 * to ensure fresh data on the next retrieval. Typically used when you need to manually
 * update the schema or after validating a custom schema.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param validatedSchema - The validated schema to store.
 *
 * @example
 * ```typescript
 * import { storeSchema } from "./modules/schema";
 * import { validateSchemaFromContent } from "./utils";
 *
 * const context = { namespace: "my-app", cacheTimeout: 300000 };
 *
 * // Validate and store a custom schema
 * const schemaContent = JSON.stringify([...]);
 * const validatedSchema = validateSchemaFromContent(schemaContent);
 * await storeSchema(context, validatedSchema);
 * ```
 */
export async function storeSchema(
  context: SchemaContext,
  validatedSchema: ConfigSchemaField[],
): Promise<void> {
  await schemaRepository.saveSchema(JSON.stringify(validatedSchema, null, 2));
  await schemaRepository.deleteCachedSchema(context.namespace);
}

/**
 * Tries to get schema from cache.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @returns Promise resolving to cached schema or null if not found.
 */
async function tryGetFromCache(
  context: SchemaContext,
): Promise<ConfigSchemaField[] | null> {
  try {
    const cached = await schemaRepository.getCachedSchema(context.namespace);
    if (cached) {
      return cached;
    }
  } catch (_error) {
    // Cache failure shouldn't prevent trying storage
  }
  return null;
}

/**
 * Tries to get schema from persistent storage (lib-files).
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @returns Promise resolving to stored schema or null if not found.
 */
async function tryGetFromStorage(
  context: SchemaContext,
): Promise<ConfigSchemaField[] | null> {
  try {
    const schemaContent = await schemaRepository.getPersistedSchema();
    const schema = JSON.parse(schemaContent);

    await cacheSchema(context, schema);
    return schema;
  } catch (_error) {
    return null;
  }
}

/**
 * Handles version checking and updating for stored schema.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param storedSchema - The currently stored schema.
 * @returns Promise resolving to updated schema if version changed, otherwise the stored schema.
 */
async function handleStoredSchemaUpdate(
  context: SchemaContext,
  storedSchema: ConfigSchemaField[],
): Promise<ConfigSchemaField[]> {
  try {
    const { content, version: currentVersion } =
      await schemaUtils.readBundledSchemaWithVersion();
    const shouldUpdate = await hasVersionChanged(context, currentVersion);

    if (!shouldUpdate) {
      return storedSchema;
    }

    return await initializeSchemaFromContent(context, content, currentVersion);
  } catch (_error) {
    // If version checking/update fails, return stored schema as fallback
    return storedSchema;
  }
}

/**
 * Initializes schema from bundled file (lazy initialization).
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @returns Promise resolving to validated schema or empty array if initialization fails.
 */
async function initializeSchemaFromBundledFile(
  context: SchemaContext,
): Promise<ConfigSchemaField[]> {
  try {
    const schemaContent = await schemaUtils.readBundledSchemaFile();
    const validatedSchema =
      schemaUtils.validateSchemaFromContent(schemaContent);
    const currentVersion = schemaUtils.calculateSchemaVersion(schemaContent);

    await storeSchema(context, validatedSchema);
    await storeSchemaVersion(context, currentVersion);

    return validatedSchema;
  } catch (_error) {
    // All options exhausted, return empty schema
    return [];
  }
}

/**
 * Initializes schema from content and version.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param content - Schema content as JSON string.
 * @param version - Schema version hash.
 * @returns Promise resolving to validated schema.
 */
async function initializeSchemaFromContent(
  context: SchemaContext,
  content: string,
  version: string,
): Promise<ConfigSchemaField[]> {
  const validatedSchema = schemaUtils.validateSchemaFromContent(content);

  await storeSchema(context, validatedSchema);
  await storeSchemaVersion(context, version);

  return validatedSchema;
}

/**
 * Checks if schema should be updated by comparing versions.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param currentVersion - Current schema version hash.
 * @returns Promise resolving to true if version changed, false otherwise.
 */
async function hasVersionChanged(
  context: SchemaContext,
  currentVersion: string,
): Promise<boolean> {
  const storedVersion = await schemaRepository.getSchemaVersion(
    context.namespace,
  );

  return currentVersion !== storedVersion;
}

/**
 * Stores schema version hash.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param version - Schema version hash to store.
 */
async function storeSchemaVersion(
  context: SchemaContext,
  version: string,
): Promise<void> {
  await schemaRepository.setSchemaVersion(context.namespace, version);
}

/**
 * Caches schema in lib-state.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param schema - Schema to cache.
 */
async function cacheSchema(
  context: SchemaContext,
  schema: ConfigSchemaField[],
): Promise<void> {
  await schemaRepository.setCachedSchema(
    context.namespace,
    schema,
    context.cacheTimeout,
  );
}
