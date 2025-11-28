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
 * Get the scope tree from cache or Commerce API
 *
 * @param params - Configuration options. If `refreshData` is true, `commerceConfig` is required.
 * @returns Scope tree as array with metadata about data freshness and any fallback information
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
 * Sync Commerce scopes forces a fresh fetch from Commerce API and updates cache
 * @returns Sync result with updated scope tree and sync status
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
 * Get the configuration schema with lazy initialization and version checking
 */
export function getConfigSchema(params?: FetchOptions) {
  const context = {
    namespace: DEFAULT_NAMESPACE,
    cacheTimeout: params?.cacheTimeout ?? globalFetchOptions.cacheTimeout,
  };

  return getSchemaModule(context);
}

/**
 * Get configuration for a scope identified by code and level or id.
 * @param params - Configuration options
 * @param args - either (id) or (code, level)
 * @returns Promise resolving to configuration response
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
 * Get a specific configuration value by key for a scope identified by code and level or id.
 * @param params - Configuration options
 * @param configKey - The name of the configuration field to retrieve
 * @param args - either (id) or (code, level)
 * @returns Promise resolving to configuration response with single config value
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
 * Set configuration for a scope identified by code and level or id.
 * @param params - Configuration options
 * @param request - Configuration set request
 * @param args - either (id) or (code, level)
 * @returns Promise resolving to configuration response
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
 * Set custom scope tree
 * @param params - Configuration options
 * @param request - Custom scopes to set
 * @returns Response with updated custom scopes
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
