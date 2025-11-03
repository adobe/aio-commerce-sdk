/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { ConfigSchemaRepository } from "./config-schema-repository";
import { utils as schemaUtils } from "./validation";

import type { ConfigSchemaField, SchemaContext } from "./types";

/**
 * Get the configuration schema with lazy initialization and version checking
 * @param context - Context containing namespace and cache timeout
 * @returns Promise resolving to array of schema fields
 */
export async function getSchema(
  context: SchemaContext,
): Promise<ConfigSchemaField[]> {
  const repository = new ConfigSchemaRepository();

  const cachedSchema = await tryGetFromCache(context, repository);
  if (cachedSchema) {
    return cachedSchema;
  }

  const storedSchema = await tryGetFromStorage(context, repository);
  if (storedSchema) {
    return await handleStoredSchemaUpdate(context, repository, storedSchema);
  }

  return await initializeSchemaFromBundledFile(context, repository);
}

/**
 * Store validated schema
 * @param context - Schema context
 * @param repository - Schema repository
 * @param validatedSchema - The validated schema to store
 */
export async function storeSchema(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
  validatedSchema: ConfigSchemaField[],
): Promise<void> {
  await repository.saveSchema(JSON.stringify(validatedSchema, null, 2));
  await repository.deleteCachedSchema(context.namespace);
}

/**
 * Try to get schema from cache
 */
async function tryGetFromCache(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
): Promise<ConfigSchemaField[] | null> {
  try {
    const cached = await repository.getCachedSchema(context.namespace);
    if (cached) {
      return cached;
    }
  } catch (_error) {
    // Cache failure shouldn't prevent trying storage
  }
  return null;
}

/**
 * Try to get schema from persistent storage (lib-files)
 */
async function tryGetFromStorage(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
): Promise<ConfigSchemaField[] | null> {
  try {
    const schemaContent = await repository.getPersistedSchema();
    const schema = JSON.parse(schemaContent);

    await cacheSchema(context, repository, schema);
    return schema;
  } catch (_error) {
    return null;
  }
}

/**
 * Handle version checking and updating for stored schema
 */
async function handleStoredSchemaUpdate(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
  storedSchema: ConfigSchemaField[],
): Promise<ConfigSchemaField[]> {
  try {
    const { content, version: currentVersion } =
      await schemaUtils.readBundledSchemaWithVersion();
    const shouldUpdate = await hasVersionChanged(
      context,
      repository,
      currentVersion,
    );

    if (!shouldUpdate) {
      return storedSchema;
    }

    return await initializeSchemaFromContent(
      context,
      repository,
      content,
      currentVersion,
    );
  } catch (_error) {
    // If version checking/update fails, return stored schema as fallback
    return storedSchema;
  }
}

/**
 * Initialize schema from bundled file (lazy initialization)
 */
async function initializeSchemaFromBundledFile(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
): Promise<ConfigSchemaField[]> {
  try {
    const schemaContent = await schemaUtils.readBundledSchemaFile();
    const validatedSchema =
      schemaUtils.validateSchemaFromContent(schemaContent);
    const currentVersion = schemaUtils.calculateSchemaVersion(schemaContent);

    await storeSchema(context, repository, validatedSchema);
    await storeSchemaVersion(context, repository, currentVersion);

    return validatedSchema;
  } catch (_error) {
    // All options exhausted, return empty schema
    return [];
  }
}

/**
 * Initialize schema from content and version
 */
async function initializeSchemaFromContent(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
  content: string,
  version: string,
): Promise<ConfigSchemaField[]> {
  const validatedSchema = schemaUtils.validateSchemaFromContent(content);

  await storeSchema(context, repository, validatedSchema);
  await storeSchemaVersion(context, repository, version);

  return validatedSchema;
}

/**
 * Check if schema should be updated by comparing versions
 */
async function hasVersionChanged(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
  currentVersion: string,
): Promise<boolean> {
  const storedVersion = await repository.getSchemaVersion(context.namespace);

  return currentVersion !== storedVersion;
}

/**
 * Store schema version hash
 */
async function storeSchemaVersion(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
  version: string,
): Promise<void> {
  await repository.setSchemaVersion(context.namespace, version);
}

/**
 * Cache schema in lib-state
 */
async function cacheSchema(
  context: SchemaContext,
  repository: ConfigSchemaRepository,
  schema: ConfigSchemaField[],
): Promise<void> {
  await repository.setCachedSchema(
    context.namespace,
    schema,
    context.cacheTimeout,
  );
}
