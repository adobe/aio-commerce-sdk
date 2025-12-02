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

import { DEFAULT_CUSTOM_SCOPE_LEVEL } from "#utils/constants";

import type { ConfigValue } from "#modules/configuration/index";
import type {
  AcceptableConfigValue,
  ConfigValueWithOptionalOrigin,
} from "#modules/configuration/types";
import type { ConfigSchemaField } from "#modules/schema/index";
import type { ScopeNode, ScopeTree } from "#modules/scope-tree/index";

/**
 * Checks if the given value is a non-empty string.
 * @param value The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates the provided arguments for scope retrieval.
 * @param args - The arguments to validate.
 * @returns True if the arguments are valid, false otherwise.
 */
export function areValidArgs(args: unknown[]): boolean {
  if (args.length === 2) {
    return isNonEmptyString(args[0]) && isNonEmptyString(args[1]);
  }
  if (args.length === 1) {
    return isNonEmptyString(args[0]);
  }
  return false;
}

/**
 * Finds a scope node by its ID.
 * @param tree - The scope tree to search.
 * @param id - The ID of the scope node to find.
 * @returns The found scope node or null if not found.
 */
function findScopeNodeById(tree: ScopeTree, id: string): ScopeNode | null {
  const traverse = (node: ScopeNode): ScopeNode | null => {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = traverse(child);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  for (const root of tree) {
    const found = traverse(root);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Derives the scope information from the provided arguments.
 * @param code - The code of the scope to find.
 * @param level - The level of the scope to find.
 * @param tree - The scope tree to search.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromCodeAndLevel(
  code: unknown,
  level: unknown,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (!(isNonEmptyString(code) && isNonEmptyString(level))) {
    throw new Error("INVALID_ARGS: expected (code: string, level: string)");
  }
  const trimmedCode = code.trim();
  const trimmedLevel = level.trim();
  const path = findScopePath(tree, trimmedCode, trimmedLevel);
  const node = path.find(
    (scopeNode) =>
      scopeNode.code === trimmedCode && scopeNode.level === trimmedLevel,
  );

  if (path.length === 0 || !node) {
    throw new Error(
      `INVALID_SCOPE: Unknown scope code='${trimmedCode}' level='${trimmedLevel}'`,
    );
  }

  return {
    scopeCode: node.code,
    scopeLevel: node.level,
    scopeId: node.id,
    scopePath: path,
  };
}

/**
 * Derives the scope information from the provided id.
 * @param id - The id of the scope to find.
 * @param tree - The scope tree to search for the node.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromId(
  id: unknown,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (!isNonEmptyString(id)) {
    throw new Error("INVALID_ARGS: expected (id: string)");
  }
  const trimmedId = id.trim();
  const node = findScopeNodeById(tree, trimmedId);
  if (!node) {
    throw new Error(`INVALID_SCOPE_ID: No scope found for id '${trimmedId}'`);
  }
  const path = findScopePath(tree, node.code, node.level);
  return {
    scopeCode: node.code,
    scopeLevel: node.level,
    scopeId: node.id,
    scopePath: path,
  };
}

/**
 * Derives scope from code with optional level (applies default if missing)
 * @param code - The code of the scope to find.
 * @param level - The level of the scope to find (optional, defaults to base level).
 * @param tree - The scope tree to search.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromCodeWithOptionalLevel(
  code: unknown,
  level: unknown | undefined,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (!isNonEmptyString(code)) {
    throw new Error("INVALID_ARGS: expected (code: string)");
  }

  if (!isNonEmptyString(level)) {
    throw new Error("INVALID_ARGS: expected (level: string)");
  }

  const effectiveLevel = level?.trim() || DEFAULT_CUSTOM_SCOPE_LEVEL;
  return deriveScopeFromCodeAndLevel(code, effectiveLevel, tree);
}

/**
 * Derives the scope information from the provided arguments.
 * @param args - The arguments containing either (id), (code), or (code, level).
 * @param tree - The scope tree to search for the node.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromArgs(args: unknown[], tree: ScopeTree) {
  if (args.length === 2) {
    return deriveScopeFromCodeAndLevel(args[0], args[1], tree);
  }
  if (args.length === 1) {
    const arg = args[0];
    // Try as ID first, then as code with default level
    try {
      return deriveScopeFromId(arg, tree);
    } catch (_error) {
      // If ID lookup fails, treat as code with default level
      return deriveScopeFromCodeWithOptionalLevel(arg, undefined, tree);
    }
  }
  throw new Error("INVALID_ARGS: expected (id), (code), or (code, level)");
}

/**
 * Finds a scope path in the tree.
 * @param tree - The scope tree to search.
 * @param code - The code of the scope to find.
 * @param level - The level of the scope to find.
 * @returns The found scope path or an empty array if not found.
 */
export function findScopePath(tree: ScopeTree, code: string, level: string) {
  const path: ScopeNode[] = [];
  const traverse = (node: ScopeNode, parents: ScopeNode[]): boolean => {
    const extendedPath = parents.concat(node);
    if (node.code === code && node.level === level) {
      path.push(...extendedPath);
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (traverse(child, extendedPath)) {
          return true;
        }
      }
    }
    return false;
  };
  for (const root of tree) {
    if (traverse(root, [])) {
      return path.reverse();
    }
  }
  return [];
}

/**
 * Sanitize request config entries to contain only valid name/value pairs
 * @param entries - The entries to sanitize.
 * @returns The sanitized entries.
 */
export function sanitizeRequestEntries(
  entries: ConfigValueWithOptionalOrigin[],
): ConfigValueWithOptionalOrigin[] {
  const list = Array.isArray(entries) ? entries : [];
  return list
    .filter((entry) => {
      if (!entry || typeof entry.name !== "string") {
        return false;
      }
      const hasValidValue = ["string", "number", "boolean"].includes(
        typeof entry.value,
      );
      return entry.name.trim().length > 0 && hasValidValue;
    })
    .map((entry) => ({
      name: String(entry.name).trim(),
      value: entry.value as string | number | boolean,
      origin: entry.origin,
    }));
}

/**
 * Merge existing and requested entries, setting origin to the current scope for requested entries
 * @param existingScopeEntries - The existing scope entries.
 * @param requestedScopeEntries - The requested scope entries.
 * @param scopeCode - The code of the scope.
 * @param scopeLevel - The level of the scope.
 * @returns The merged scope entries.
 */
export function mergeScopes(
  existingScopeEntries: ConfigValueWithOptionalOrigin[],
  requestedScopeEntries: ConfigValueWithOptionalOrigin[],
  scopeCode: string,
  scopeLevel: string,
) {
  const mergedMap = new Map<string, ConfigValue>();
  for (const existingEntry of existingScopeEntries) {
    mergedMap.set(existingEntry.name, {
      name: existingEntry.name,
      value: existingEntry.value,
      origin: existingEntry.origin || { code: scopeCode, level: scopeLevel },
    });
  }

  for (const requestedEntry of requestedScopeEntries) {
    mergedMap.set(requestedEntry.name, {
      name: requestedEntry.name,
      value: requestedEntry.value,
      origin: { code: scopeCode, level: scopeLevel },
    });
  }

  return Array.from(mergedMap.values()).map((data) => ({
    name: data.name,
    value: data.value,
    origin: data.origin,
  }));
}

/**
 * Build default config entries from schema defaults
 * @param schema - The schema to build the defaults from.
 * @returns The default config entries.
 */
export function getSchemaDefaults(schema: ConfigSchemaField[]) {
  const defaults = schema
    .filter((field) => field.default !== undefined)
    .map((field) => ({
      name: field.name,
      value: field.default as string,
      origin: { code: "default", level: "system" },
    }));

  return { config: defaults };
}

/**
 * Merges config entries into the target map if not already present
 * @param merged - The target map to merge into
 * @param entries - The config entries to merge
 * @param origin - The origin information for the entries
 */
function mergeConfigEntries(
  merged: Map<string, ConfigValue>,
  entries: ConfigValue[],
  origin: { code: string; level: string },
) {
  for (const entry of entries) {
    if (!merged.has(entry.name)) {
      merged.set(entry.name, {
        name: entry.name,
        value: entry.value,
        origin,
      });
    }
  }
}

/**
 * Loads and merges config from the inheritance path
 * @param merged - The target map to merge into
 * @param scopePath - The path of scope nodes to load from
 * @param loadScopeConfigFn - Function to load config for a scope
 */
async function mergeConfigFromPath(
  merged: Map<string, ConfigValue>,
  scopePath: ScopeNode[],
  loadScopeConfigFn: (
    code: string,
  ) => Promise<{ scope: ScopeNode; config: ConfigValue[] } | null>,
) {
  for (const node of scopePath) {
    const persisted = await loadScopeConfigFn(node.code);
    if (persisted?.config && Array.isArray(persisted.config)) {
      mergeConfigEntries(merged, persisted.config, {
        code: node.code,
        level: node.level,
      });
    }
  }
}

/**
 * Checks if global scope is in the path and loads it if not
 * @param merged - The target map to merge into
 * @param scopePath - The path of scope nodes
 * @param loadScopeConfigFn - Function to load config for a scope
 */
async function mergeGlobalConfigIfNeeded(
  merged: Map<string, ConfigValue>,
  scopePath: ScopeNode[],
  loadScopeConfigFn: (
    code: string,
  ) => Promise<{ scope: ScopeNode; config: ConfigValue[] } | null>,
) {
  const hasGlobal = scopePath.some(
    (node) => node.code === "global" && node.level === "global",
  );

  if (!hasGlobal) {
    const globalConfig = await loadScopeConfigFn("global");
    if (globalConfig?.config && Array.isArray(globalConfig.config)) {
      mergeConfigEntries(merged, globalConfig.config, {
        code: "global",
        level: "global",
      });
    }
  }
}

/**
 * Merges the current config data into the map
 * @param merged - The target map to merge into
 * @param configData - The current config data
 * @param scopeCode - The code of the scope
 * @param scopeLevel - The level of the scope
 */
function mergeCurrentConfigData(
  merged: Map<string, ConfigValue>,
  configData: { scope: ScopeNode; config: ConfigValue[] },
  scopeCode: string,
  scopeLevel: string,
) {
  if (configData?.config && Array.isArray(configData.config)) {
    for (const entry of configData.config) {
      if (!merged.has(entry.name)) {
        merged.set(entry.name, {
          name: entry.name,
          value: entry.value,
          origin: entry.origin || {
            code: configData.scope?.code || scopeCode,
            level: configData.scope?.level || scopeLevel,
          },
        });
      }
    }
  }
}

/**
 * Applies schema defaults to the merged config
 * @param merged - The target map to apply defaults to
 * @param defaultMap - The map of default values
 */
function applySchemaDefaults(
  merged: Map<string, ConfigValue>,
  defaultMap: Map<string, AcceptableConfigValue>,
) {
  for (const [name, def] of defaultMap.entries()) {
    if (!merged.has(name)) {
      merged.set(name, {
        name,
        value: def,
        origin: { code: "default", level: "system" },
      });
    }
  }
}

/** Parameters for mergeWithSchemaDefaults function */
type MergeWithSchemaDefaultsParams = {
  loadScopeConfigFn: (
    code: string,
  ) => Promise<{ scope: ScopeNode; config: ConfigValue[] } | null>;
  getSchemaFn: () => Promise<ConfigSchemaField[]>;
  configData: { scope: ScopeNode; config: ConfigValue[] };
  scopeCode: string;
  scopeLevel: string;
  scopePath: ScopeNode[];
};

/**
 * Merge inherited configs along the scope path and ensure schema defaults exist
 * @param params - The parameters object
 * @param params.loadScopeConfigFn - The function to load the scope config.
 * @param params.getSchemaFn - The function to get the schema.
 * @param params.configData - The config data to merge.
 * @param params.scopeCode - The code of the scope.
 * @param params.scopeLevel - The level of the scope.
 * @param params.scopePath - The path of the scope.
 * @returns The merged config data. Returns null if the config data is not valid.
 * @throws An error if the config data is not valid.
 */
export async function mergeWithSchemaDefaults({
  loadScopeConfigFn,
  getSchemaFn,
  configData,
  scopeCode,
  scopeLevel,
  scopePath,
}: MergeWithSchemaDefaultsParams) {
  const schema = await getSchemaFn();
  const defaultMap = new Map<string, AcceptableConfigValue>();
  for (const field of schema) {
    if (field.default !== undefined) {
      defaultMap.set(field.name, field.default);
    }
  }

  const merged: Map<string, ConfigValue> = new Map();
  await mergeConfigFromPath(merged, scopePath, loadScopeConfigFn);
  await mergeGlobalConfigIfNeeded(merged, scopePath, loadScopeConfigFn);

  mergeCurrentConfigData(merged, configData, scopeCode, scopeLevel);
  applySchemaDefaults(merged, defaultMap);
  configData.config = Array.from(merged.entries()).map(([name, data]) => ({
    name,
    value: data.value,
    origin: data.origin,
  }));

  return configData;
}

/**
 * Selector type for identifying a scope by its unique ID.
 */
export type SelectorByScopeId = {
  by: {
    _tag: "scopeId";
    scopeId: string;
  };
};

/**
 * Selector type for identifying a scope by its code and level.
 */
export type SelectorByCodeAndLevel = {
  by: {
    _tag: "codeAndLevel";
    code: string;
    level: string;
  };
};

/**
 * Selector type for identifying a scope by its code only.
 */
export type SelectorByCode = {
  by: {
    _tag: "code";
    code: string;
  };
};

/**
 * Discriminated union type for selecting a scope by different methods.
 *
 * Use the helper functions {@link byScopeId}, {@link byCodeAndLevel}, or {@link byCode} to create
 * selector objects instead of constructing them manually.
 */
export type SelectorBy =
  | SelectorByScopeId
  | SelectorByCodeAndLevel
  | SelectorByCode;

/**
 * Creates a scope selector that identifies a scope by its unique ID.
 *
 * This is the most direct way to identify a scope when you already know its ID.
 * Scope IDs are unique identifiers assigned to each scope in the scope tree.
 *
 * @param scopeId - The unique identifier of the scope.
 * @returns A selector object that identifies the scope by ID.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byScopeId } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration for a scope by its ID
 * const config = await getConfiguration(byScopeId("scope-123"));
 * ```
 */
export function byScopeId(scopeId: string): SelectorByScopeId {
  return { by: { _tag: "scopeId", scopeId } };
}

/**
 * Creates a scope selector that identifies a scope by its code and level.
 *
 * This selector is useful when you know both the scope code and its level in
 * the hierarchy (e.g., "website" level "website", "store" level "store").
 *
 * @param code - The code identifier of the scope (e.g., "us-east", "main_store").
 * @param level - The level of the scope in the hierarchy (e.g., "website", "store", "store_view").
 * @returns A selector object that identifies the scope by code and level.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byCodeAndLevel } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration for a website scope
 * const config = await getConfiguration(byCodeAndLevel("us-east", "website"));
 *
 * // Get configuration for a store scope
 * const storeConfig = await getConfiguration(byCodeAndLevel("main_store", "store"));
 * ```
 */
export function byCodeAndLevel(
  code: string,
  level: string,
): SelectorByCodeAndLevel {
  return { by: { _tag: "codeAndLevel", code, level } };
}

/**
 * Creates a scope selector that identifies a scope by its code only.
 *
 * This selector uses the scope code and will resolve to the default level for that code.
 * Use this when you want to let the system determine the appropriate level based on
 * the code alone.
 *
 * @param code - The code identifier of the scope.
 * @returns A selector object that identifies the scope by code.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byCode } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration by code (uses default level)
 * const config = await getConfiguration(byCode("us-east"));
 * ```
 */
export function byCode(code: string): SelectorByCode {
  return { by: { _tag: "code", code } };
}
