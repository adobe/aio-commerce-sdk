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

import type { BusinessConfigSchema, SchemaContext } from "./types";

/**
 * Gets the configuration schema with lazy initialization and version checking.
 *
 * The schema defines the structure of configuration fields available in your application,
 * including field names, types, default values, and validation rules.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @returns Promise resolving to an array of schema field definitions.
 */
export async function getSchema(
  context: SchemaContext,
): Promise<BusinessConfigSchema> {
  const cachedSchema = await tryGetFromCache(context);
  if (cachedSchema) {
    return cachedSchema;
  }

  const storedSchema = await tryGetFromStorage(context);
  if (storedSchema) {
    return storedSchema;
  }

  return [];
}

/**
 * Tries to get schema from cache.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @returns Promise resolving to cached schema or null if not found.
 */
async function tryGetFromCache(
  context: SchemaContext,
): Promise<BusinessConfigSchema | null> {
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
): Promise<BusinessConfigSchema | null> {
  try {
    const schemaContent = await schemaRepository.getPersistedSchema();
    const schema = JSON.parse(schemaContent);

    await schemaRepository.setCachedSchema(
      context.namespace,
      schema,
      context.cacheTimeout,
    );

    return schema;
  } catch (_error) {
    return null;
  }
}
