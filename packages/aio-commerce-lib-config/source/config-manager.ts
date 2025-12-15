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

import { DEFAULT_CACHE_TIMEOUT, DEFAULT_NAMESPACE } from "#utils/constants";

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

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { SelectorBy } from "#config-utils";
import type { GetScopeTreeResult, ScopeTree } from "./modules/scope-tree";
import type {
  GlobalLibConfigOptions,
  LibConfigOptions,
  SetConfigurationRequest,
  SetCustomScopeTreeRequest,
} from "./types";

const globalLibConfigOptions: GlobalLibConfigOptions = {
  cacheTimeout: DEFAULT_CACHE_TIMEOUT,
};

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
 * // All subsequent calls will use this cache timeout unless overridden
 * const schema = await getConfigSchema();
 * ```
 */
export function setGlobalLibConfigOptions(options: LibConfigOptions) {
  globalLibConfigOptions.cacheTimeout =
    options.cacheTimeout ?? DEFAULT_CACHE_TIMEOUT;
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
) {
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
) {
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
export function getConfigSchema(options?: LibConfigOptions) {
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
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

  if (selector.by._tag === "scopeId") {
    return await getConfigModule(context, selector.by.scopeId);
  }

  if (selector.by._tag === "codeAndLevel") {
    return await getConfigModule(context, selector.by.code, selector.by.level);
  }

  return await getConfigModule(context, selector.by.code);
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
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

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

  return await getConfigByKeyModule(context, configKey, selector.by.code);
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
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

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

  return await setConfigModule(context, request, selector.by.code);
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
) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

  return await setCustomScopeTreeModule(context, request);
}

/**
 * Gets the version history for a configuration scope.
 *
 * This function retrieves the version history for a specific scope, showing
 * all configuration changes over time with their diffs and metadata.
 *
 * @param scopeCode - The scope code to get history for.
 * @param historyOptions - Optional pagination and filtering options.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to version history with pagination.
 *
 * @example
 * ```typescript
 * import { getConfigurationHistory } from "@adobe/aio-commerce-lib-config";
 *
 * // Get latest 25 versions
 * const history = await getConfigurationHistory("my-scope");
 * console.log(`Total versions: ${history.pagination.total}`);
 *
 * history.versions.forEach((version) => {
 *   console.log(`Version ${version.versionNumber}: ${version.timestamp}`);
 *   console.log(`Changes: ${version.diff.length}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { getConfigurationHistory } from "@adobe/aio-commerce-lib-config";
 *
 * // Get versions with pagination
 * const history = await getConfigurationHistory("my-scope", {
 *   limit: 10,
 *   offset: 0,
 * });
 *
 * if (history.pagination.hasMore) {
 *   console.log("More versions available");
 * }
 * ```
 */
export async function getConfigurationHistory(
  scopeCode: string,
  historyOptions?: { limit?: number; offset?: number },
  _options?: LibConfigOptions,
) {
  const { getVersionHistory } = await import(
    "./modules/versioning/version-manager"
  );

  const context = {
    namespace: DEFAULT_NAMESPACE,
    maxVersions: getMaxVersionsFromEnv(),
  };

  return getVersionHistory(context, {
    scopeCode,
    limit: historyOptions?.limit,
    offset: historyOptions?.offset,
  });
}

/**
 * Gets the audit log entries with optional filtering.
 *
 * This function retrieves audit log entries for configuration changes,
 * with support for filtering by scope, user, action type, and date range.
 *
 * @param filters - Optional filters for the audit log query.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to audit log entries with pagination.
 *
 * @example
 * ```typescript
 * import { getAuditLog } from "@adobe/aio-commerce-lib-config";
 *
 * // Get all audit entries
 * const auditLog = await getAuditLog();
 * console.log(`Total entries: ${auditLog.pagination.total}`);
 * ```
 *
 * @example
 * ```typescript
 * import { getAuditLog } from "@adobe/aio-commerce-lib-config";
 *
 * // Filter by scope and user
 * const auditLog = await getAuditLog({
 *   scopeCode: "my-scope",
 *   userId: "user@example.com",
 *   action: "update",
 *   limit: 50,
 * });
 *
 * auditLog.entries.forEach((entry) => {
 *   console.log(`${entry.timestamp}: ${entry.actor.userId} performed ${entry.action}`);
 *   console.log(`Version: ${entry.versionId}`);
 *   console.log(`Changes: ${entry.changes.length}`);
 * });
 * ```
 */
export async function getAuditLog(
  filters?: {
    scopeCode?: string;
    userId?: string;
    action?: "create" | "update" | "rollback";
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
  _options?: LibConfigOptions,
) {
  const { getAuditLog: getAuditLogModule } = await import(
    "./modules/audit/audit-logger"
  );

  const context = {
    namespace: DEFAULT_NAMESPACE,
  };

  return getAuditLogModule(context, filters ?? {});
}

/**
 * Rolls back configuration to a previous version.
 *
 * This function restores configuration for a scope to a specific previous version,
 * creating a new version entry and audit log record for the rollback operation.
 *
 * @param scopeCode - The scope code to rollback.
 * @param versionId - The version ID to rollback to.
 * @param metadata - Optional metadata about who is performing the rollback.
 * @param options - Optional library configuration options for cache timeout.
 * @returns Promise resolving to configuration response with updated scope and config values.
 *
 * @example
 * ```typescript
 * import { rollbackConfiguration } from "@adobe/aio-commerce-lib-config";
 *
 * // Rollback to a specific version
 * const result = await rollbackConfiguration("my-scope", "version-id-123", {
 *   actor: {
 *     userId: "admin@example.com",
 *     source: "admin-panel",
 *   },
 * });
 *
 * console.log(`Rolled back to version ${result.versionInfo?.versionNumber}`);
 * console.log(`New version ID: ${result.versionInfo?.versionId}`);
 * ```
 */
export async function rollbackConfiguration(
  scopeCode: string,
  versionId: string,
  metadata?: {
    actor?: {
      userId?: string;
      source?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  },
  options?: LibConfigOptions,
) {
  const { getVersionById: getVersionModule } = await import(
    "./modules/versioning/version-manager"
  );
  const { setConfiguration: setConfigurationModule } = await import(
    "./modules/configuration/set-config"
  );

  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: options?.cacheTimeout ?? globalLibConfigOptions.cacheTimeout,
  };

  const versionContext = {
    namespace: DEFAULT_NAMESPACE,
    maxVersions: getMaxVersionsFromEnv(),
  };

  // Get the version to rollback to
  const targetVersion = await getVersionModule(
    versionContext,
    scopeCode,
    versionId,
  );

  if (!targetVersion) {
    throw new Error(`Version ${versionId} not found for scope ${scopeCode}`);
  }

  // Convert snapshot to config request format
  const configRequest: SetConfigurationRequest & {
    metadata?: { action?: "rollback" };
  } = {
    config: targetVersion.snapshot.map((item) => ({
      name: item.name,
      value: item.value,
    })),
    metadata: {
      ...metadata,
      action: "rollback" as const,
    },
  };

  // Use existing setConfiguration logic with rollback metadata
  return setConfigurationModule(context, configRequest, scopeCode);
}

/**
 * Gets a before/after comparison for a specific version.
 *
 * This function retrieves a complete before/after view of configuration changes
 * for a specific version, perfect for UI display.
 *
 * @param scopeCode - The scope code.
 * @param versionId - The version ID to get comparison for.
 * @param options - Optional library configuration options.
 * @returns Promise resolving to version comparison or null if not found.
 *
 * @example
 * ```typescript
 * import { getVersionComparison } from "@adobe/aio-commerce-lib-config";
 *
 * const comparison = await getVersionComparison("my-scope", "version-id-123");
 *
 * if (comparison) {
 *   console.log("Before:");
 *   comparison.before.forEach(item => {
 *     console.log(`  ${item.name}: ${item.value}`);
 *   });
 *
 *   console.log("\nAfter:");
 *   comparison.after.forEach(item => {
 *     console.log(`  ${item.name}: ${item.value}`);
 *   });
 *
 *   console.log("\nChanges:");
 *   comparison.changes.forEach(change => {
 *     if (change.type === "modified") {
 *       console.log(`  ${change.name}: ${change.oldValue} → ${change.newValue}`);
 *     } else if (change.type === "added") {
 *       console.log(`  ${change.name}: (added) ${change.newValue}`);
 *     } else {
 *       console.log(`  ${change.name}: (removed)`);
 *     }
 *   });
 * }
 * ```
 */
export async function getVersionComparison(
  scopeCode: string,
  versionId: string,
  _options?: LibConfigOptions,
) {
  const { getVersionComparison: getVersionComparisonModule } = await import(
    "./modules/versioning/version-comparison"
  );

  const context = {
    namespace: DEFAULT_NAMESPACE,
    maxVersions: getMaxVersionsFromEnv(),
  };

  return getVersionComparisonModule(context, scopeCode, versionId);
}

/**
 * Compares two versions side-by-side.
 *
 * This function compares any two versions and shows all differences between them,
 * useful for UI features like "compare version 5 with version 10".
 *
 * @param scopeCode - The scope code.
 * @param fromVersionId - Earlier version ID.
 * @param toVersionId - Later version ID.
 * @param options - Optional library configuration options.
 * @returns Promise resolving to two-version comparison or null if either not found.
 *
 * @example
 * ```typescript
 * import { compareVersions } from "@adobe/aio-commerce-lib-config";
 *
 * const comparison = await compareVersions(
 *   "my-scope",
 *   "version-5-id",
 *   "version-10-id"
 * );
 *
 * if (comparison) {
 *   console.log(`Comparing v${comparison.fromVersion.versionNumber} to v${comparison.toVersion.versionNumber}`);
 *   console.log(`Changes: ${comparison.changes.length}`);
 *
 *   // Show side-by-side differences
 *   comparison.changes.forEach(change => {
 *     console.log(`\n${change.name}:`);
 *     console.log(`  From: ${change.oldValue}`);
 *     console.log(`  To:   ${change.newValue}`);
 *     console.log(`  Type: ${change.type}`);
 *   });
 * }
 * ```
 */
export async function compareVersions(
  scopeCode: string,
  fromVersionId: string,
  toVersionId: string,
  _options?: LibConfigOptions,
) {
  const { compareTwoVersions } = await import(
    "./modules/versioning/version-comparison"
  );

  const context = {
    namespace: DEFAULT_NAMESPACE,
    maxVersions: getMaxVersionsFromEnv(),
  };

  return compareTwoVersions(context, scopeCode, fromVersionId, toVersionId);
}

/**
 * Gets a specific version by ID with its complete configuration state.
 *
 * @param scopeCode - The scope code.
 * @param versionId - The version ID.
 * @param options - Optional library configuration options.
 * @returns Promise resolving to version or null if not found.
 *
 * @example
 * ```typescript
 * import { getVersionById } from "@adobe/aio-commerce-lib-config";
 *
 * const version = await getVersionById("my-scope", "version-id-123");
 *
 * if (version) {
 *   console.log(`Version ${version.versionNumber}`);
 *   console.log(`Created: ${version.timestamp}`);
 *   console.log(`Actor: ${version.actor?.userId || "unknown"}`);
 *   console.log(`Changes: ${version.diff.length}`);
 *   console.log(`Config items: ${version.snapshot.length}`);
 * }
 * ```
 */
export async function getVersionById(
  scopeCode: string,
  versionId: string,
  _options?: LibConfigOptions,
) {
  const { getVersionById: getVersionModule } = await import(
    "./modules/versioning/version-manager"
  );

  const context = {
    namespace: DEFAULT_NAMESPACE,
    maxVersions: getMaxVersionsFromEnv(),
  };

  return getVersionModule(context, scopeCode, versionId);
}

import {
  DEFAULT_MAX_VERSIONS,
  MAX_VERSIONS_ENV_VAR,
  MIN_VERSION_COUNT,
} from "#utils/versioning-constants";

/**
 * Gets the maximum number of versions to keep from environment or defaults.
 *
 * @returns Maximum number of versions to retain per scope.
 * @internal
 */
function getMaxVersionsFromEnv(): number {
  const envValue = process.env[MAX_VERSIONS_ENV_VAR];

  if (!envValue) {
    return DEFAULT_MAX_VERSIONS;
  }

  const parsedValue = Number.parseInt(envValue, 10);

  if (Number.isNaN(parsedValue) || parsedValue < MIN_VERSION_COUNT) {
    return DEFAULT_MAX_VERSIONS;
  }

  return parsedValue;
}
