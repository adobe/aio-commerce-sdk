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
  getConfigurationByKey as getConfigByKeyModule,
  getConfiguration as getConfigModule,
  setConfiguration as setConfigModule,
} from "./modules/configuration";
import { getSchema as getSchemaModule } from "./modules/schema";
import {
  getScopeTree as getScopeTreeModule,
  setCustomScopeTree as setCustomScopeTreeModule,
} from "./modules/scope-tree";
import { DEFAULT_CACHE_TIMEOUT, DEFAULT_NAMESPACE } from "./utils/constants";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { GetScopeTreeResult, ScopeTree } from "./modules/scope-tree";
import type {
  FetchOptions,
  GlobalFetchOptions,
  SetConfigurationRequest,
  SetCustomScopeTreeRequest,
} from "./types";

const globalFetchOptions: GlobalFetchOptions = {
  cacheTimeout: DEFAULT_CACHE_TIMEOUT,
};

/**
 * Sets global fetch options that will be used as defaults for all operations of the library.
 * @param options - The fetch options to set globally.
 * @example
 * ```typescript
 * import { setGlobalFetchOptions } from "@adobe/aio-commerce-lib-config";
 *
 * // Set a global cache timeout of 5 minutes (300000ms)
 * setGlobalFetchOptions({ cacheTimeout: 300000 });
 *
 * // All subsequent calls will use this cache timeout unless overridden
 * const schema = await getConfigSchema();
 * ```
 */
export function setGlobalFetchOptions(options: FetchOptions) {
  globalFetchOptions.cacheTimeout =
    options.cacheTimeout ?? DEFAULT_CACHE_TIMEOUT;
}

type GetFreshScopeTreeParams = FetchOptions & {
  refreshData: true;
  commerceConfig: CommerceHttpClientParams;
};

type GetCachedScopeTreeParams = FetchOptions & {
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
 * const result = await getScopeTree({
 *   refreshData: true,
 *   commerceConfig,
 * });
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
 * const result = await getScopeTree({
 *   cacheTimeout: 600000, // 10 minutes
 * });
 * ```
 */

// Overload for cached Commerce data
export async function getScopeTree(
  params?: GetCachedScopeTreeParams,
): Promise<GetScopeTreeResult>;

// Overload for fresh Commerce data
export async function getScopeTree(
  params: GetFreshScopeTreeParams,
): Promise<GetScopeTreeResult>;

export async function getScopeTree(
  params?: GetCachedScopeTreeParams | GetFreshScopeTreeParams,
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
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
 * @param params - Configuration options including Commerce API client parameters.
 * @param params.commerceConfig - The Commerce HTTP client configuration required for API calls.
 * @param params.cacheTimeout - Optional cache timeout in milliseconds.
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
 * const result = await syncCommerceScopes({ commerceConfig });
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
  params: FetchOptions & { commerceConfig: CommerceHttpClientParams },
) {
  try {
    const result = await getScopeTree({
      ...params,
      refreshData: true,
    });

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
 * Gets the configuration schema with lazy initialization and version checking.
 *
 * The schema defines the structure of configuration fields available in your application,
 * including field names, types, default values, and validation rules. The schema is
 * cached and automatically updated when the bundled schema version changes.
 *
 * @param params - Optional fetch options for cache timeout.
 * @returns Promise resolving to an array of schema field definitions.
 *
 * @example
 * ```typescript
 * import { getConfigSchema } from "@adobe/aio-commerce-lib-config";
 *
 * // Get the configuration schema
 * const schema = await getConfigSchema();
 *
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
export function getConfigSchema(params?: FetchOptions) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
  };

  return getSchemaModule(context);
}

/**
 * Gets configuration for a scope identified by code and level or id.
 *
 * This function retrieves all configuration values for a specific scope, including
 * inherited values from parent scopes and schema defaults. The configuration is
 * merged according to the scope hierarchy.
 *
 * @param params - Optional configuration options for cache timeout.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with scope information and config values.
 *
 * @example
 * ```typescript
 * import { getConfiguration } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration by scope ID
 * const config = await getConfiguration(undefined, "scope-123");
 * console.log(config.scope); // { id, code, level }
 * console.log(config.config); // Array of config values with origins
 * ```
 *
 * @example
 * ```typescript
 * import { getConfiguration } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration by code and level
 * const config = await getConfiguration(undefined, "website", "website");
 * config.config.forEach((item) => {
 *   console.log(`${item.name}: ${item.value} (from ${item.origin.code})`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { getConfiguration } from "@adobe/aio-commerce-lib-config";
 *
 * // Get configuration with custom cache timeout
 * const config = await getConfiguration(
 *   { cacheTimeout: 300000 },
 *   "store",
 *   "store_view"
 * );
 * ```
 */
export async function getConfiguration(
  params?: FetchOptions,
  ...args: unknown[]
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
  };

  return await getConfigModule(context, ...args);
}

/**
 * Gets a specific configuration value by key for a scope identified by code and level or id.
 *
 * This function retrieves a single configuration value for a specific scope. It's useful
 * when you only need one configuration field rather than the entire configuration object.
 *
 * @param configKey - The name of the configuration field to retrieve.
 * @param params - Optional configuration options for cache timeout.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with scope information and single config value (or null if not found).
 *
 * @example
 * ```typescript
 * import { getConfigurationByKey } from "@adobe/aio-commerce-lib-config";
 *
 * // Get a specific config value by scope ID
 * const result = await getConfigurationByKey("api_key", undefined, "scope-123");
 *
 * if (result.config) {
 *   console.log(`API Key: ${result.config.value}`);
 *   console.log(`Origin: ${result.config.origin.code}`);
 * } else {
 *   console.log("API Key not found for this scope");
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { getConfigurationByKey } from "@adobe/aio-commerce-lib-config";
 *
 * // Get a specific config value by code and level
 * const result = await getConfigurationByKey(
 *   "enable_feature",
 *   undefined,
 *   "website",
 *   "website"
 * );
 *
 * if (result.config) {
 *   const isEnabled = result.config.value === true || result.config.value === "true";
 *   console.log(`Feature enabled: ${isEnabled}`);
 * }
 * ```
 */
export async function getConfigurationByKey(
  configKey: string,
  params?: FetchOptions,
  ...args: unknown[]
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
  };

  return await getConfigByKeyModule(context, configKey, ...args);
}

/**
 * Sets configuration values for a scope identified by code and level or id.
 *
 * This function updates configuration values for a specific scope. The provided values
 * are merged with existing configuration, and the origin is set to the current scope.
 * Configuration values are inherited from parent scopes unless explicitly overridden.
 *
 * @param request - Configuration set request containing the config values to set.
 * @param params - Optional configuration options for cache timeout.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with updated scope and config values.
 *
 * @example
 * ```typescript
 * import { setConfiguration } from "@adobe/aio-commerce-lib-config";
 *
 * // Set configuration by scope ID
 * const result = await setConfiguration(
 *   {
 *     config: [
 *       { name: "api_key", value: "your-api-key-here" },
 *       { name: "enable_feature", value: true },
 *     ],
 *   },
 *   undefined,
 *   "scope-123"
 * );
 *
 * console.log(result.message); // "Configuration values updated successfully"
 * console.log(result.scope); // Updated scope information
 * console.log(result.config); // Array of updated config values
 * ```
 *
 * @example
 * ```typescript
 * import { setConfiguration } from "@adobe/aio-commerce-lib-config";
 *
 * // Set configuration by code and level
 * const result = await setConfiguration(
 *   {
 *     config: [
 *       { name: "timeout", value: 5000 },
 *       { name: "retry_count", value: 3 },
 *     ],
 *   },
 *   undefined,
 *   "website",
 *   "website"
 * );
 *
 * console.log(`Updated ${result.config.length} configuration values`);
 * ```
 */
export async function setConfiguration(
  request: SetConfigurationRequest,
  params?: FetchOptions,
  ...args: unknown[]
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
  };

  return await setConfigModule(context, request, ...args);
}

/**
 * Sets the custom scope tree, replacing all existing custom scopes with the provided ones.
 *
 * Custom scopes allow you to define additional configuration scopes beyond the standard
 * Commerce scopes (global, website, store, store_view). This function replaces all
 * custom scopes, preserving system scopes (global and commerce).
 *
 * @param request - Custom scope tree request containing the scopes to set.
 * @param params - Optional configuration options for cache timeout.
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
  params?: FetchOptions,
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
  };

  return await setCustomScopeTreeModule(context, request);
}
