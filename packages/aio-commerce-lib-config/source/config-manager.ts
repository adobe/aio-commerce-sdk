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

import {
  deriveScopeFromArgs,
  deriveScopeFromCodeAndLevel,
} from "#config-utils";
import { DEFAULT_CACHE_TIMEOUT, DEFAULT_NAMESPACE } from "#utils/constants";

import {
  getConfigurationByKey as getConfigByKeyModule,
  getConfiguration as getConfigModule,
  setConfiguration as setConfigModule,
} from "./modules/configuration";
import {
  loadConfig,
  persistConfig,
} from "./modules/configuration/configuration-repository";
import { getSchema as getSchemaModule } from "./modules/schema";
import { getPersistedSchema } from "./modules/schema/config-schema-repository";
import { initializeSchema } from "./modules/schema/initialize";
import { getPasswordFields } from "./modules/schema/utils";
import {
  getPersistedScopeTree,
  getScopeTree as getScopeTreeModule,
  saveScopeTree,
  setCustomScopeTree as setCustomScopeTreeModule,
} from "./modules/scope-tree";
import {
  getVersionRecord,
  listVersionRecords,
} from "./modules/versioning/version-repository";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { SelectorBy } from "#config-utils";
import type { ConfigContext, ConfigValue } from "./modules/configuration/types";
import type { BusinessConfigSchema } from "./modules/schema";
import type {
  GetScopeTreeResult,
  ScopeNode,
  ScopeTree,
} from "./modules/scope-tree";
import type {
  GetConfigurationByKeyResponse,
  GetConfigurationResponse,
  GetConfigurationVersionsParams,
  GetConfigurationVersionsResponse,
  GlobalLibConfigOptions,
  LibConfigOptions,
  RestoreConfigurationVersionRequest,
  RestoreConfigurationVersionResponse,
  SetConfigurationRequest,
  SetConfigurationResponse,
  SetCustomScopeTreeRequest,
  SetCustomScopeTreeResponse,
} from "./types";

const globalLibConfigOptions: GlobalLibConfigOptions = {
  cacheTimeout: DEFAULT_CACHE_TIMEOUT,
  encryptionKey: undefined,
};

/** Options for initializing the configuration library, so that it works as expected. */
export type InitializeOptions = {
  /** Optional schema to use as the source of truth (latest version). */
  schema?: BusinessConfigSchema;
};

/**
 * Initializes the configuration library so that it works as expected.
 * @param options - Options for initializing the configuration library.
 */
export async function initialize(options: InitializeOptions): Promise<void> {
  if (options.schema) {
    await initializeSchema(
      {
        namespace: DEFAULT_NAMESPACE,
        cacheTimeout: DEFAULT_CACHE_TIMEOUT,
      },
      options.schema,
    );
    return;
  }

  const storedSchema = await getPersistedSchema();
  if (!storedSchema) {
    throw new Error("Schema has never been set before");
  }
}

/**
 * Sets global library configuration options that will be used as defaults for all operations of the library.
 * @param options - The library configuration options to set globally.
 * @example
 * ```typescript
 * import { setGlobalLibConfigOptions } from "@adobe/aio-commerce-lib-config";
 *
 * // Set a global cache timeout of 5 minutes (300000ms)
 * setGlobalLibConfigOptions({ cacheTimeout: 300000 });
 *
 * // Set encryption key programmatically instead of using environment variable
 * setGlobalLibConfigOptions({
 *   encryptionKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
 * });
 *
 * // All subsequent calls will use this cache timeout unless overridden
 * const schema = await getConfigSchema();
 * ```
 */
export function setGlobalLibConfigOptions(options: LibConfigOptions) {
  globalLibConfigOptions.cacheTimeout =
    options.cacheTimeout ?? globalLibConfigOptions.cacheTimeout;
  globalLibConfigOptions.encryptionKey =
    options.encryptionKey !== undefined
      ? options.encryptionKey
      : globalLibConfigOptions.encryptionKey;
}

/**
 * Gets global library configuration defaults.
 * @returns The current global library configuration options.
 * @internal
 */
export function getGlobalLibConfigOptions(): GlobalLibConfigOptions {
  return globalLibConfigOptions;
}

function resolveConfigContext(options?: LibConfigOptions): ConfigContext {
  return {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
    encryptionKey:
      options?.encryptionKey !== undefined
        ? (options.encryptionKey ?? undefined)
        : (globalLibConfigOptions.encryptionKey ?? undefined),
  };
}

async function resolveScopeForSelector(selector: SelectorBy): Promise<{
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
}> {
  const scopeTree = await getPersistedScopeTree(DEFAULT_NAMESPACE);
  if (selector.by._tag === "scopeId") {
    return deriveScopeFromArgs([selector.by.scopeId], scopeTree);
  }
  if (selector.by._tag === "codeAndLevel") {
    return deriveScopeFromArgs(
      [selector.by.code, selector.by.level],
      scopeTree,
    );
  }

  const matches = findScopesByCode(scopeTree, selector.by.code);
  if (matches.length === 0) {
    throw new Error(`INVALID_SCOPE: Unknown scope code='${selector.by.code}'`);
  }
  if (matches.length > 1) {
    throw new Error(
      `AMBIGUOUS_SCOPE_CODE: Multiple scopes found for code='${selector.by.code}', provide level`,
    );
  }

  return deriveScopeFromCodeAndLevel(
    selector.by.code,
    matches[0].level,
    scopeTree,
  );
}

function findScopesByCode(
  scopeTree: ScopeTree,
  scopeCode: string,
): Array<{ level: string }> {
  const matches: Array<{ level: string }> = [];
  const visit = (scope: ScopeTree[number]) => {
    if (scope.code === scopeCode) {
      matches.push({ level: scope.level });
    }
    if (scope.children) {
      for (const child of scope.children) {
        visit(child);
      }
    }
  };

  for (const root of scopeTree) {
    visit(root);
  }

  return matches;
}

/** Parameters for getting the scope tree from Commerce API. */
export type GetFreshScopeTreeParams = {
  refreshData: true;
  commerceConfig: CommerceHttpClientParams;
};

/** Parameters for getting the scope tree from cache. */
export type GetCachedScopeTreeParams = {
  refreshData?: false | undefined;
};

/**
 * Gets the scope tree from cache or Commerce API.
 *
 * The scope tree represents the hierarchical structure of configuration scopes available
 * in your Adobe Commerce instance. This includes both system scopes (global, website, store)
 * and custom scopes that may have been defined.
 *
 * @param params - Configuration options. If `refreshData` is true, `commerceConfig` is required.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to scope tree with metadata about data freshness and any fallback information.
 *
 * @example
 * ```typescript
 * import { getScopeTree } from "@adobe/aio-commerce-lib-config";
 *
 * // Get cached scope tree (default behavior)
 * const result = await getScopeTree();
 * console.log(result.scopeTree); // Array of scope nodes
 * console.log(result.isCachedData); // true
 * ```
 *
 * @example
 * ```typescript
 * import { getScopeTree } from "@adobe/aio-commerce-lib-config";
 * import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
 *
 * // Refresh scope tree from Commerce API
 * const commerceConfig: CommerceHttpClientParams = {
 *   url: "https://your-commerce-instance.com",
 *   // ... other auth config
 * };
 *
 * const result = await getScopeTree(
 *   { refreshData: true, commerceConfig },
 *   { cacheTimeout: 600000 }
 * );
 * console.log(result.scopeTree); // Fresh data from Commerce API
 * console.log(result.isCachedData); // false
 * if (result.fallbackError) {
 *   console.warn("Used fallback data:", result.fallbackError);
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { getScopeTree } from "@adobe/aio-commerce-lib-config";
 *
 * // Get scope tree with custom cache timeout
 * const result = await getScopeTree(undefined, { cacheTimeout: 600000 });
 * ```
 */

// Overload for cached Commerce data
export async function getScopeTree(
  params?: GetCachedScopeTreeParams,
  options?: LibConfigOptions,
): Promise<GetScopeTreeResult>;

// Overload for fresh Commerce data
export async function getScopeTree(
  params: GetFreshScopeTreeParams,
  options?: LibConfigOptions,
): Promise<GetScopeTreeResult>;

// Implementation
export async function getScopeTree(
  params?: GetCachedScopeTreeParams | GetFreshScopeTreeParams,
  options?: LibConfigOptions,
): Promise<GetScopeTreeResult> {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

  if (params?.refreshData === true) {
    return getScopeTreeModule(
      {
        ...context,
        commerceConfig: params.commerceConfig,
      },
      { remoteFetch: true },
    );
  }

  return getScopeTreeModule(context, { remoteFetch: false });
}

/**
 * Syncs Commerce scopes by forcing a fresh fetch from Commerce API and updating the cache.
 *
 * This function is useful when you need to ensure your scope tree is up-to-date with
 * the latest changes from your Commerce instance. It will fetch fresh data and update
 * both the cache and persistent storage.
 *
 * @param commerceConfig - The Commerce HTTP client configuration required for API calls.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to sync result with updated scope tree and sync status.
 *
 * @example
 * ```typescript
 * import { syncCommerceScopes } from "@adobe/aio-commerce-lib-config";
 * import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
 *
 * const commerceConfig: CommerceHttpClientParams = {
 *   url: "https://your-commerce-instance.com",
 *   // ... other auth config
 * };
 *
 * const result = await syncCommerceScopes(commerceConfig);
 *
 * if (result.synced) {
 *   console.log("Successfully synced scope tree");
 *   console.log(result.scopeTree); // Updated scope tree
 * } else {
 *   console.log("Used cached data");
 * }
 *
 * if (result.error) {
 *   console.warn("Sync completed with errors:", result.error);
 * }
 * ```
 */
export async function syncCommerceScopes(
  commerceConfig: CommerceHttpClientParams,
  options?: LibConfigOptions,
): Promise<{
  scopeTree: ScopeTree;
  synced: boolean;
  error?: string;
}> {
  try {
    const result = await getScopeTree(
      {
        refreshData: true,
        commerceConfig,
      },
      options,
    );

    const syncResult: {
      scopeTree: ScopeTree;
      synced: boolean;
      error?: string;
    } = {
      scopeTree: result.scopeTree,
      synced: !result.isCachedData,
    };

    if (result.fallbackError) {
      syncResult.error = result.fallbackError;
    }

    return syncResult;
  } catch (error) {
    throw new Error(
      `Failed to sync Commerce scopes: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Removes the commerce scope from the persisted scope tree.
 *
 * @returns Promise resolving to an object with `unsynced` indicating whether the scope
 *   was found and removed.
 *
 * @example
 * ```typescript
 * import { unsyncCommerceScopes } from "@adobe/aio-commerce-lib-config";
 *
 * const result = await unsyncCommerceScopes();
 * if (result.unsynced) {
 *   console.log("Commerce scope removed successfully");
 * } else {
 *   console.log("Commerce scope not found");
 * }
 * ```
 */
export async function unsyncCommerceScopes(): Promise<{ unsynced: boolean }> {
  const COMMERCE_SCOPE_CODE = "commerce";
  const scopeTree = await getPersistedScopeTree(DEFAULT_NAMESPACE);

  if (!scopeTree.some((scope) => scope.code === COMMERCE_SCOPE_CODE)) {
    return { unsynced: false };
  }

  // Remove 'commerce' scope
  const updatedScopeTree = scopeTree.filter(
    (scope) => scope.code !== COMMERCE_SCOPE_CODE,
  );

  // Save updated scope tree
  await saveScopeTree(DEFAULT_NAMESPACE, updatedScopeTree);

  return { unsynced: true };
}

/**
 * Gets the configuration schema with lazy initialization and version checking.
 *
 * The schema defines the structure of configuration fields available in your application,
 * including field names, types, default values, and validation rules. The schema is
 * cached and automatically updated when the bundled schema version changes.
 *
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to an array of schema field definitions.
 *
 * @example
 * ```typescript
 * import { getConfigSchema } from "@adobe/aio-commerce-lib-config";
 *
 * // Get the configuration schema
 * const schema = await getConfigSchema();
 * schema.forEach((field) => {
 *   console.log(`Field: ${field.name}`);
 *   console.log(`Type: ${field.type}`);
 *   console.log(`Default: ${field.default}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { getConfigSchema } from "@adobe/aio-commerce-lib-config";
 *
 * // Get schema with custom cache timeout
 * const schema = await getConfigSchema({ cacheTimeout: 300000 });
 *
 * // Find a specific field
 * const apiKeyField = schema.find((field) => field.name === "api_key");
 * if (apiKeyField) {
 *   console.log("API Key field found:", apiKeyField);
 * }
 * ```
 */
export function getConfigSchema(
  options?: LibConfigOptions,
): Promise<BusinessConfigSchema> {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

  return getSchemaModule(context);
}

/**
 * Gets configuration for a scope.
 *
 * This function retrieves all configuration values for a specific scope, including
 * inherited values from parent scopes and schema defaults. The configuration is
 * merged according to the scope hierarchy.
 *
 * @param selector - Scope selector specifying how to identify the scope.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to configuration response with scope information and config values.
 *
 * @example
 * ```typescript
 * import { getConfiguration, byScopeId, byCodeAndLevel, byCode } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration by scope ID
 * const config1 = await getConfiguration(byScopeId("scope-123"));
 * console.log(config1.scope); // { id, code, level }
 * console.log(config1.config); // Array of config values with origins
 *
 * // Get configuration by code and level
 * const config2 = await getConfiguration(byCodeAndLevel("website", "website"));
 * config2.config.forEach((item) => {
 *   console.log(`${item.name}: ${item.value} (from ${item.origin.code})`);
 * });
 *
 * // Get configuration by code (uses default level)
 * const config3 = await getConfiguration(byCode("website"));
 * ```
 */
export async function getConfiguration(
  selector: SelectorBy,
  options?: LibConfigOptions,
): Promise<GetConfigurationResponse> {
  const context = resolveConfigContext(options);

  if (selector.by._tag === "scopeId") {
    return await getConfigModule(context, selector.by.scopeId);
  }

  if (selector.by._tag === "codeAndLevel") {
    return await getConfigModule(context, selector.by.code, selector.by.level);
  }

  const resolvedScope = await resolveScopeForSelector(selector);
  return await getConfigModule(context, resolvedScope.scopeId);
}

/**
 * Gets a specific configuration value by key for a scope.
 *
 * This function retrieves a single configuration value for a specific scope. It's useful
 * when you only need one configuration field rather than the entire configuration object.
 *
 * @param configKey - The name of the configuration field to retrieve.
 * @param selector - Scope selector specifying how to identify the scope.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to configuration response with scope information and single config value (or null if not found).
 *
 * @example
 * ```typescript
 * import { getConfigurationByKey, byScopeId, byCodeAndLevel, byCode } from "@adobe/aio-commerce-lib-config";
 *
 * // Get a specific config value by scope ID
 * const result1 = await getConfigurationByKey("api_key", byScopeId("scope-123"));
 *
 * if (result1.config) {
 *   console.log(`API Key: ${result1.config.value}`);
 *   console.log(`Origin: ${result1.config.origin.code}`);
 * }
 *
 * // Get a specific config value by code and level
 * const result2 = await getConfigurationByKey("enable_feature", byCodeAndLevel("website", "website"));
 *
 * // Get a specific config value by code
 * const result3 = await getConfigurationByKey("api_key", byCode("website"));
 * ```
 */
export async function getConfigurationByKey(
  configKey: string,
  selector: SelectorBy,
  options?: LibConfigOptions,
): Promise<GetConfigurationByKeyResponse> {
  const context = resolveConfigContext(options);

  if (selector.by._tag === "scopeId") {
    return await getConfigByKeyModule(context, configKey, selector.by.scopeId);
  }

  if (selector.by._tag === "codeAndLevel") {
    return await getConfigByKeyModule(
      context,
      configKey,
      selector.by.code,
      selector.by.level,
    );
  }

  const resolvedScope = await resolveScopeForSelector(selector);
  return await getConfigByKeyModule(context, configKey, resolvedScope.scopeId);
}

/**
 * Sets configuration values for a scope.
 *
 * This function updates configuration values for a specific scope. The provided values
 * are merged with existing configuration, and the origin is set to the current scope.
 * Configuration values are inherited from parent scopes unless explicitly overridden.
 *
 * @param request - Configuration set request containing the config values to set.
 * @param selector - Scope selector specifying how to identify the scope.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to configuration response with updated scope and config values.
 *
 * @example
 * ```typescript
 * import { setConfiguration, byScopeId, byCodeAndLevel } from "@adobe/aio-commerce-lib-config";
 *
 * // Set configuration by scope ID
 * const result1 = await setConfiguration(
 *   {
 *     config: [
 *       { name: "api_key", value: "your-api-key-here" },
 *       { name: "enable_feature", value: true },
 *     ],
 *   },
 *   byScopeId("scope-123")
 * );
 *
 * // Set configuration by code and level
 * const result2 = await setConfiguration(
 *   {
 *     config: [
 *       { name: "timeout", value: 5000 },
 *       { name: "retry_count", value: 3 },
 *     ],
 *   },
 *   byCodeAndLevel("website", "website")
 * );
 *
 * console.log(result2.message); // "Configuration values updated successfully"
 * console.log(result2.scope); // Updated scope information
 * console.log(result2.config); // Array of updated config values
 * ```
 */
export async function setConfiguration(
  request: SetConfigurationRequest,
  selector: SelectorBy,
  options?: LibConfigOptions,
): Promise<SetConfigurationResponse> {
  const context = resolveConfigContext(options);

  if (selector.by._tag === "scopeId") {
    return await setConfigModule(context, request, selector.by.scopeId);
  }

  if (selector.by._tag === "codeAndLevel") {
    return await setConfigModule(
      context,
      request,
      selector.by.code,
      selector.by.level,
    );
  }

  const resolvedScope = await resolveScopeForSelector(selector);
  return await setConfigModule(context, request, resolvedScope.scopeId);
}

/**
 * Lists configuration versions for a scope.
 */
export async function getConfigurationVersions(
  selector: SelectorBy,
  params?: GetConfigurationVersionsParams,
  _options?: LibConfigOptions,
): Promise<GetConfigurationVersionsResponse> {
  const resolvedScope = await resolveScopeForSelector(selector);
  const page = await listVersionRecords(resolvedScope.scopeCode, params);
  return {
    scope: {
      id: resolvedScope.scopeId,
      code: resolvedScope.scopeCode,
      level: resolvedScope.scopeLevel,
    },
    versions: page.versions,
    pagination: {
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    },
  };
}

/**
 * Restores configuration values from a selected version.
 *
 * Default behavior restores only keys that changed in the selected version
 * (`added`, `updated`, `removed`). When `fields` are provided, only those keys
 * are processed. Removed keys are applied as deletions from current scope.
 */
export async function restoreConfigurationVersion(
  selector: SelectorBy,
  request: RestoreConfigurationVersionRequest,
  options?: LibConfigOptions,
): Promise<RestoreConfigurationVersionResponse> {
  const context = resolveConfigContext(options);

  const resolvedScope = await resolveScopeForSelector(selector);
  const selectedVersion = await getVersionRecord(
    resolvedScope.scopeCode,
    request.versionId,
  );
  if (!selectedVersion) {
    throw new Error(
      `VERSION_NOT_FOUND: id='${request.versionId}' scope='${resolvedScope.scopeCode}'`,
    );
  }
  assertVersionSnapshotHasConfig(selectedVersion.snapshot);

  const selectedPayload = toPersistedPayload(
    selectedVersion.snapshot,
    resolvedScope.scopeId,
    resolvedScope.scopeCode,
    resolvedScope.scopeLevel,
  );
  const currentPayload =
    (await loadConfig(resolvedScope.scopeCode)) ??
    toPersistedPayload(
      undefined,
      resolvedScope.scopeId,
      resolvedScope.scopeCode,
      resolvedScope.scopeLevel,
    );

  const targetKeys = resolveRestoreTargetKeys(selectedVersion.change, request);
  const removedInSelected = new Set(selectedVersion.change.removed);
  const selectedByName = new Map(
    selectedPayload.config.map((entry) => [entry.name, entry]),
  );
  const nextByName = new Map(
    currentPayload.config.map((entry) => [entry.name, entry]),
  );

  const restoredConfig: RestoreConfigurationVersionResponse["config"] = [];
  const removed: string[] = [];
  for (const key of targetKeys) {
    if (removedInSelected.has(key)) {
      const didDelete = nextByName.delete(key);
      if (didDelete) {
        removed.push(key);
      }
      continue;
    }

    const versionEntry = selectedByName.get(key);
    if (!versionEntry) {
      continue;
    }

    const normalizedEntry: ConfigValue = {
      name: versionEntry.name,
      value: versionEntry.value,
      origin: {
        code: resolvedScope.scopeCode,
        level: resolvedScope.scopeLevel,
      },
    };
    nextByName.set(key, normalizedEntry);
    restoredConfig.push({
      name: normalizedEntry.name,
      value: normalizedEntry.value,
    });
  }

  const nextPayload = {
    scope: {
      id: resolvedScope.scopeId,
      code: resolvedScope.scopeCode,
      level: resolvedScope.scopeLevel,
    },
    config: Array.from(nextByName.values()),
  };

  const schema = await getSchemaModule(context);
  const passwordFieldNames = getPasswordFields(schema);

  await persistConfig(resolvedScope.scopeCode, nextPayload, {
    reason: "restore",
    restoredFromVersionId: selectedVersion.id,
    expectedLatestVersionId: request.expectedLatestVersionId,
    passwordFieldNames,
  });

  return {
    message: "Configuration restored successfully",
    timestamp: new Date().toISOString(),
    scope: {
      id: resolvedScope.scopeId,
      code: resolvedScope.scopeCode,
      level: resolvedScope.scopeLevel,
    },
    restoredFromVersionId: selectedVersion.id,
    config: restoredConfig,
    removed,
  };
}

/**
 * Sets the custom scope tree, replacing all existing custom scopes with the provided ones.
 *
 * Custom scopes allow you to define additional configuration scopes beyond the standard
 * Commerce scopes (global, website, store, store_view). This function replaces all
 * custom scopes, preserving system scopes (global and commerce).
 *
 * @param request - Custom scope tree request containing the scopes to set.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to response with updated custom scopes.
 *
 * @example
 * ```typescript
 * import { setCustomScopeTree } from "@adobe/aio-commerce-lib-config";
 *
 * // Set custom scopes
 * const result = await setCustomScopeTree(
 *   {
 *     scopes: [
 *       {
 *         code: "region_us",
 *         label: "US Region",
 *         level: "custom",
 *         is_editable: true,
 *         is_final: false,
 *         children: [
 *           {
 *             code: "region_us_west",
 *             label: "US West",
 *             level: "custom",
 *             is_editable: true,
 *             is_final: true,
 *           },
 *         ],
 *       },
 *     ],
 *   }
 * );
 *
 * console.log(result.message); // "Custom scope tree updated successfully"
 * console.log(result.scopes); // Array of created/updated custom scopes
 * ```
 *
 * @example
 * ```typescript
 * import { setCustomScopeTree } from "@adobe/aio-commerce-lib-config";
 *
 * // Update existing custom scope (preserves ID if code and level match)
 * const result = await setCustomScopeTree(
 *   {
 *     scopes: [
 *       {
 *         id: "existing-scope-id", // Preserve existing ID
 *         code: "region_eu",
 *         label: "European Region",
 *         level: "custom",
 *         is_editable: true,
 *         is_final: false,
 *       },
 *     ],
 *   }
 * );
 * ```
 */
export async function setCustomScopeTree(
  request: SetCustomScopeTreeRequest,
  options?: LibConfigOptions,
): Promise<SetCustomScopeTreeResponse> {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

  return await setCustomScopeTreeModule(context, request);
}

function resolveRestoreTargetKeys(
  change: {
    added: string[];
    updated: string[];
    removed: string[];
  },
  request: RestoreConfigurationVersionRequest,
): string[] {
  const requestedFields =
    request.fields
      ?.map((field) => field.trim())
      .filter((field) => field.length > 0) ?? [];
  if (requestedFields.length > 0) {
    return Array.from(new Set(requestedFields));
  }

  return Array.from(
    new Set([...change.added, ...change.updated, ...change.removed]),
  );
}

function toPersistedPayload(
  payload: unknown,
  scopeId: string,
  scopeCode: string,
  scopeLevel: string,
): {
  scope: {
    id: string;
    code: string;
    level: string;
  };
  config: ConfigValue[];
} {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("config" in payload) ||
    !Array.isArray(payload.config)
  ) {
    return {
      scope: { id: scopeId, code: scopeCode, level: scopeLevel },
      config: [],
    };
  }

  const normalizedConfig: ConfigValue[] = payload.config
    .filter(
      (
        entry,
      ): entry is {
        name: string;
        value: ConfigValue["value"];
        origin?: { code?: string; level?: string };
      } =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        typeof entry.name === "string" &&
        "value" in entry,
    )
    .map((entry) => ({
      name: entry.name,
      value: normalizeConfigValue(entry.value),
      origin: {
        code:
          entry.origin?.code && entry.origin.code.trim().length > 0
            ? entry.origin.code
            : scopeCode,
        level:
          entry.origin?.level && entry.origin.level.trim().length > 0
            ? entry.origin.level
            : scopeLevel,
      },
    }));

  return {
    scope: { id: scopeId, code: scopeCode, level: scopeLevel },
    config: normalizedConfig,
  };
}

function normalizeConfigValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function assertVersionSnapshotHasConfig(snapshot: unknown): void {
  if (
    typeof snapshot !== "object" ||
    snapshot === null ||
    !("config" in snapshot) ||
    !Array.isArray(snapshot.config)
  ) {
    throw new Error(
      "VERSION_SNAPSHOT_INVALID: missing config array in snapshot",
    );
  }
}
