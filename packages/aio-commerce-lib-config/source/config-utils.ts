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
  ConfigValueWithOptionalOrigin,
  SetConfigValue,
} from "#modules/configuration/types";
import type {
  BusinessConfigSchemaValue,
  ResolvedBusinessConfigSchema,
} from "#modules/schema/index";
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
    const isCodeAndLevel =
      isNonEmptyString(args[0]) && isNonEmptyString(args[1]);
    const isCommerceIdAndLevel =
      typeof args[0] === "number" &&
      Number.isFinite(args[0]) &&
      isNonEmptyString(args[1]);
    return isCodeAndLevel || isCommerceIdAndLevel;
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
 * Finds a scope node by its Commerce API ID and level.
 *
 * `commerce_id` is unique only within a single level (e.g., a website with id=1
 * and a store with id=1 can coexist), so the level is required to disambiguate.
 *
 * @param tree - The scope tree to search.
 * @param commerceScopeId - The Commerce API ID of the scope node to find.
 * @param level - The level of the scope node to find.
 * @returns The found scope node or null if not found.
 */
function findScopeNodeByCommerceScopeId(
  tree: ScopeTree,
  commerceScopeId: number,
  level: string,
): ScopeNode | null {
  const traverse = (node: ScopeNode): ScopeNode | null => {
    if (node.commerce_id === commerceScopeId && node.level === level) {
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
    scopeId: node.id,
    scopeLevel: node.level,
    scopePath: path,
  };
}

/**
 * Derives the scope information from a Commerce API ID and level.
 * @param commerceScopeId - The Commerce API id of the scope to find.
 * @param level - The level of the scope to find.
 * @param tree - The scope tree to search.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromCommerceScopeId(
  commerceScopeId: unknown,
  level: unknown,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (
    !(typeof commerceScopeId === "number" && Number.isFinite(commerceScopeId))
  ) {
    throw new Error(
      "INVALID_ARGS: expected (commerceScopeId: number, level: string)",
    );
  }
  if (!isNonEmptyString(level)) {
    throw new Error(
      "INVALID_ARGS: expected (commerceScopeId: number, level: string)",
    );
  }
  const trimmedLevel = level.trim();
  const node = findScopeNodeByCommerceScopeId(
    tree,
    commerceScopeId,
    trimmedLevel,
  );
  if (!node) {
    throw new Error(
      `INVALID_SCOPE: Unknown scope commerceScopeId='${commerceScopeId}' level='${trimmedLevel}'`,
    );
  }
  const path = findScopePath(tree, node.code, node.level);
  return {
    scopeCode: node.code,
    scopeId: node.id,
    scopeLevel: node.level,
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
    scopeId: node.id,
    scopeLevel: node.level,
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

  if (level !== undefined && !isNonEmptyString(level)) {
    throw new Error("INVALID_ARGS: expected (level: string)");
  }

  const effectiveLevel = isNonEmptyString(level)
    ? level.trim()
    : DEFAULT_CUSTOM_SCOPE_LEVEL;
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
    if (typeof args[0] === "number") {
      return deriveScopeFromCommerceScopeId(args[0], args[1], tree);
    }
    return deriveScopeFromCodeAndLevel(args[0], args[1], tree);
  }
  if (args.length === 1) {
    const [arg] = args;
    // Try as ID first, then as code with default level
    try {
      return deriveScopeFromId(arg, tree);
    } catch {
      // If ID lookup fails, treat as code with default level
      return deriveScopeFromCodeWithOptionalLevel(arg, undefined, tree);
    }
  }
  throw new Error(
    "INVALID_ARGS: expected (id), (code), (code, level), or (commerceScopeId, level)",
  );
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
 * Sanitize request config entries to contain only valid name/value pairs.
 * A `null` value is allowed and signals that the field should be unset
 * (removing the explicit override at the current scope to restore inheritance).
 * @param entries - The entries to sanitize.
 * @returns The sanitized entries.
 */
export function sanitizeRequestEntries(
  entries: SetConfigValue[],
): SetConfigValue[] {
  const list = Array.isArray(entries) ? entries : [];
  return list
    .filter((entry) => {
      if (!entry || typeof entry.name !== "string") {
        return false;
      }

      if (entry.value === null) {
        return true; // null is valid: signals an unset
      }

      // TODO: This should be done via schema validation.
      const hasValidValue =
        ["string", "boolean"].includes(typeof entry.value) ||
        (Array.isArray(entry.value) &&
          entry.value.every((item) => typeof item === "string"));

      return entry.name.trim().length > 0 && hasValidValue;
    })
    .map((entry) => ({
      name: String(entry.name).trim(),
      value: entry.value as BusinessConfigSchemaValue | null,
    }));
}

/**
 * Merge existing and requested entries, setting origin to the current scope for requested entries.
 * A `null` value in a requested entry removes that field from the persisted config,
 * restoring inheritance from the parent scope.
 * @param existingScopeEntries - The existing scope entries.
 * @param requestedScopeEntries - The requested scope entries.
 * @param scopeCode - The code of the scope.
 * @param scopeLevel - The level of the scope.
 * @returns The merged scope entries.
 */
export function mergeScopes(
  existingScopeEntries: ConfigValueWithOptionalOrigin[],
  requestedScopeEntries: SetConfigValue[],
  scopeCode: string,
  scopeLevel: string,
) {
  const mergedMap = new Map<string, ConfigValue>();
  for (const existingEntry of existingScopeEntries) {
    mergedMap.set(existingEntry.name, {
      name: existingEntry.name,
      origin: existingEntry.origin || { code: scopeCode, level: scopeLevel },
      value: existingEntry.value,
    });
  }

  for (const requestedEntry of requestedScopeEntries) {
    if (requestedEntry.value === null) {
      mergedMap.delete(requestedEntry.name); // unset: remove override, restore inheritance
    } else {
      mergedMap.set(requestedEntry.name, {
        name: requestedEntry.name,
        origin: { code: scopeCode, level: scopeLevel },
        value: requestedEntry.value,
      });
    }
  }

  return Array.from(mergedMap.values()).map((data) => ({
    name: data.name,
    origin: data.origin,
    value: data.value,
  }));
}

/**
 * Build default config entries from schema defaults
 * @param schema - The schema to build the defaults from.
 * @returns The default config entries.
 */
export function getSchemaDefaults(schema: ResolvedBusinessConfigSchema) {
  const defaults = schema
    .filter((field) => field.default !== undefined)
    .map((field) => ({
      name: field.name,
      origin: { code: "default", level: "system" },
      value: field.default as string,
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
        origin,
        value: entry.value,
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
  const persistedConfigs = await Promise.all(
    scopePath.map((node) => loadScopeConfigFn(node.code)),
  );

  scopePath.forEach((node, index) => {
    const persisted = persistedConfigs[index];
    if (persisted?.config && Array.isArray(persisted.config)) {
      mergeConfigEntries(merged, persisted.config, {
        code: node.code,
        level: node.level,
      });
    }
  });
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
  if (Array.isArray(configData.config)) {
    for (const entry of configData.config) {
      if (!merged.has(entry.name)) {
        merged.set(entry.name, {
          name: entry.name,
          origin: entry.origin || {
            // biome-ignore lint/suspicious/noUnnecessaryConditions: configData is deserialized from persisted storage with no runtime schema validation, so a legacy or corrupted record can lack `scope` despite the static type
            code: configData.scope?.code || scopeCode,
            // biome-ignore lint/suspicious/noUnnecessaryConditions: same as above — configData.scope may be absent on legacy/corrupted persisted records
            level: configData.scope?.level || scopeLevel,
          },
          value: entry.value,
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
  defaultMap: Map<string, BusinessConfigSchemaValue>,
) {
  for (const [name, def] of defaultMap.entries()) {
    if (!merged.has(name)) {
      merged.set(name, {
        name,
        origin: { code: "default", level: "system" },
        value: def,
      });
    }
  }
}

/** Parameters for mergeWithSchemaDefaults function */
type MergeWithSchemaDefaultsParams = {
  loadScopeConfigFn: (
    code: string,
  ) => Promise<{ scope: ScopeNode; config: ConfigValue[] } | null>;
  getSchemaFn: () => Promise<ResolvedBusinessConfigSchema>;
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
  const defaultMap = new Map<string, BusinessConfigSchemaValue>();
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
    origin: data.origin,
    value: data.value,
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
 * Selector type for identifying a system scope by its Commerce API ID.
 *
 * `commerce_id` values are unique only within a single level (a website and a
 * store can both have id=1), so the level is encoded by the factory used:
 * {@link byWebsiteId}, {@link byStoreId}, or {@link byStoreViewId}.
 */
export type SelectorByCommerceScopeId = {
  by: {
    _tag: "commerceScopeId";
    commerceScopeId: number;
    level: "website" | "store" | "store_view";
  };
};

/**
 * Discriminated union type for selecting a scope by different methods.
 *
 * Use the helper functions {@link byScopeId}, {@link byCodeAndLevel}, {@link byCode},
 * {@link byWebsiteId}, {@link byStoreId}, or {@link byStoreViewId} to create
 * selector objects instead of constructing them manually.
 */
export type SelectorBy =
  | SelectorByScopeId
  | SelectorByCodeAndLevel
  | SelectorByCode
  | SelectorByCommerceScopeId;

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

/**
 * Creates a scope selector that identifies a website by its Commerce API ID.
 *
 * Websites are returned by the Commerce REST endpoint `/V1/store/websites`. The
 * numeric ID is matched against the `commerce_id` of website-level scopes in
 * the scope tree.
 *
 * @param commerceScopeId - The Commerce API numeric ID of the website.
 * @returns A selector that identifies the website scope.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byWebsiteId } from "@adobe/aio-commerce-lib-config";
 *
 * const config = await getConfiguration(byWebsiteId(1));
 * ```
 */
export function byWebsiteId(
  commerceScopeId: number,
): SelectorByCommerceScopeId {
  return {
    by: { _tag: "commerceScopeId", commerceScopeId, level: "website" },
  };
}

/**
 * Creates a scope selector that identifies a store (store group) by its Commerce API ID.
 *
 * Store groups are returned by the Commerce REST endpoint `/V1/store/storeGroups`.
 * In the scope tree they live at the `"store"` level. The numeric ID is matched
 * against the `commerce_id` of store-level scopes.
 *
 * @param commerceScopeId - The Commerce API numeric ID of the store group.
 * @returns A selector that identifies the store scope.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byStoreId } from "@adobe/aio-commerce-lib-config";
 *
 * const config = await getConfiguration(byStoreId(1));
 * ```
 */
export function byStoreId(commerceScopeId: number): SelectorByCommerceScopeId {
  return { by: { _tag: "commerceScopeId", commerceScopeId, level: "store" } };
}

/**
 * Creates a scope selector that identifies a store view by its Commerce API ID.
 *
 * Store views are returned by the Commerce REST endpoint `/V1/store/storeViews`.
 * The numeric ID is matched against the `commerce_id` of store_view-level scopes.
 *
 * @param commerceScopeId - The Commerce API numeric ID of the store view.
 * @returns A selector that identifies the store view scope.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byStoreViewId } from "@adobe/aio-commerce-lib-config";
 *
 * const config = await getConfiguration(byStoreViewId(2));
 * ```
 */
export function byStoreViewId(
  commerceScopeId: number,
): SelectorByCommerceScopeId {
  return {
    by: { _tag: "commerceScopeId", commerceScopeId, level: "store_view" },
  };
}
