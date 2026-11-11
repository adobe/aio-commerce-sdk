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
  deriveScopeFromArgs,
  hasRequiredValue,
  mergeWithSchemaDefaults,
} from "#config-utils";
import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPersistedScopeTree } from "#modules/scope-tree/scope-tree-repository";

import { loadConfig } from "./configuration-repository";

import type { ConfigContext } from "./types";

/** Finds missing effective global values required for an installation or upgrade. */
export async function getMissingLifecycleConfiguration(
  context: ConfigContext,
  operation: "installation" | "upgrade",
): Promise<string[]> {
  const schema = requireGlobalSchema();
  const required = schema.filter((field) =>
    field.requiredFor?.includes(operation),
  );
  if (required.length === 0) {
    return [];
  }

  const tree = await getPersistedScopeTree(context.namespace);
  const { scopeCode, scopeLevel, scopePath } = deriveScopeFromArgs(
    ["global", "global"],
    tree,
  );
  const scope = scopePath.find(
    (node) => node.code === scopeCode && node.level === scopeLevel,
  );
  if (!scope) {
    throw new Error("Global configuration scope not found");
  }
  const current = await loadConfig(scopeCode, context.cacheTimeout);
  const effective = await mergeWithSchemaDefaults({
    configData: { config: current?.config ?? [], scope },
    getSchemaFn: async () => schema,
    loadScopeConfigFn: (code) => loadConfig(code, context.cacheTimeout),
    scopeCode,
    scopeLevel,
    scopePath,
  });
  return required
    .filter(
      (field) =>
        !hasRequiredValue(
          effective.config.find((entry) => entry.name === field.name)?.value,
        ),
    )
    .map((field) => field.name);
}
