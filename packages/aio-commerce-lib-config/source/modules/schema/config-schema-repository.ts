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

import type { ResolvedBusinessConfigSchema } from "./types";

// Global in-memory schema storage. The stored schema is always fully resolved
// (no `dynamicList` fields) because `initialize` refuses unresolved schemas.
let __globalSchema: ResolvedBusinessConfigSchema | null = null;

/**
 * Sets the global schema in memory.
 *
 * @param schema - Schema to store in memory.
 */
export function setGlobalSchema(schema: ResolvedBusinessConfigSchema): void {
  __globalSchema = schema;
}

/**
 * Gets the global schema from memory.
 *
 * @returns The schema stored in memory or null if not set.
 */
export function getGlobalSchema(): ResolvedBusinessConfigSchema | null {
  return __globalSchema;
}

/**
 * Gets the global schema from memory and throws an error if not initialized.
 *
 * @returns The schema stored in memory.
 * @throws Error if schema has not been initialized.
 */
export function requireGlobalSchema(): ResolvedBusinessConfigSchema {
  const schema = __globalSchema;

  if (!schema) {
    throw new Error(
      "Schema not initialized. Call `initialize({ schema })` before using configuration functions.",
    );
  }

  return schema;
}
