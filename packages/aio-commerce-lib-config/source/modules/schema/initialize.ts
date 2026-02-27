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

import * as schemaRepository from "./config-schema-repository";
import { getSchema } from "./get-schema";
import * as schemaUtils from "./utils";

import type { BusinessConfigSchema, SchemaContext } from "./types";

/**
 * Initializes schema by saving it to files and deleting the cache.
 *
 * @param context - Schema context containing namespace and cache timeout.
 * @param schema - Schema to initialize.
 */
export async function initializeSchema(
  context: SchemaContext,
  schema: BusinessConfigSchema,
) {
  const currentSchema = await getSchema(context);
  const currentVersion = schemaUtils.calculateSchemaVersion(schema);
  const newVersion = schemaUtils.calculateSchemaVersion(currentSchema);

  if (currentVersion === newVersion) {
    return currentSchema;
  }

  await schemaRepository.savePersistedSchema(
    context.namespace,
    schema,
    currentVersion,
  );

  return schema;
}
