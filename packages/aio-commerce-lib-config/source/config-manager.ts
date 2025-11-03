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
import { validateCommerceConfig } from "./utils/commerce-config-validation";
import { DEFAULT_CACHE_TIMEOUT, DEFAULT_NAMESPACE } from "./utils/constants";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { ConfigSchemaField } from "./modules/schema";
import type { ScopeTree } from "./modules/scope-tree";
import type {
  GetConfigurationByKeyResponse,
  GetConfigurationResponse,
  LibConfig,
  SetConfigurationRequest,
  SetConfigurationResponse,
  SetCustomScopeTreeRequest,
  SetCustomScopeTreeResponse,
} from "./types";

export class ConfigManager {
  private readonly cacheTimeout: number;
  private readonly commerceConfig?: CommerceHttpClientParams | undefined;

  // Fixed namespace for simplicity - 1 app : 1 commerce relationship
  private readonly namespace = DEFAULT_NAMESPACE;

  public constructor(config?: LibConfig) {
    this.cacheTimeout = config?.cacheTimeout || DEFAULT_CACHE_TIMEOUT;
    this.commerceConfig = config?.commerce;
  }

  /**
   * Get scope tree and optionally refresh commerce scopes from Commerce API
   * @param remoteFetch Whether to fetch fresh Commerce scopes
   * @returns Scope tree as array with metadata about data freshness and any fallback information
   */
  public async getScopeTree(remoteFetch = false): Promise<{
    scopeTree: ScopeTree;
    isCachedData: boolean;
    fallbackError?: string;
  }> {
    if (remoteFetch) {
      validateCommerceConfig(this.commerceConfig);
    }

    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
      commerceConfig: this.commerceConfig,
    };

    return await getScopeTreeModule(context, { remoteFetch });
  }

  /**
   * Sync Commerce scopes forces a fresh fetch from Commerce API and updates cache
   * @returns Sync result with updated scope tree and sync status
   */
  public async syncCommerceScopes(): Promise<{
    scopeTree: ScopeTree;
    synced: boolean;
    error?: string;
  }> {
    validateCommerceConfig(this.commerceConfig);

    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
      commerceConfig: this.commerceConfig,
    };

    try {
      const result = await getScopeTreeModule(context, { remoteFetch: true });

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
  public async getSchema(): Promise<ConfigSchemaField[]> {
    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
    };

    return await getSchemaModule(context);
  }

  /**
   * Get configuration for a scope identified by code and level or id.
   * @param args - either (id) or (code, level)
   * @returns
   */
  public async getConfiguration(
    ...args: unknown[]
  ): Promise<GetConfigurationResponse> {
    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
    };

    return await getConfigModule(context, ...args);
  }

  /**
   * Get a specific configuration value by key for a scope identified by code and level or id.
   * @param configKey - The name of the configuration field to retrieve
   * @param args - either (id) or (code, level)
   * @returns Promise resolving to configuration response with single config value
   */
  public async getConfigurationByKey(
    configKey: string,
    ...args: unknown[]
  ): Promise<GetConfigurationByKeyResponse> {
    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
    };

    return await getConfigByKeyModule(context, configKey, ...args);
  }

  /**
   * Set configuration for a scope identified by code and level or id.
   */
  public async setConfiguration(
    request: SetConfigurationRequest,
    ...args: unknown[]
  ): Promise<SetConfigurationResponse> {
    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
    };

    return await setConfigModule(context, request, ...args);
  }

  /**
   * Set custom scope tree
   * @param request - Custom scopes to set
   * @returns Response with updated custom scopes
   */
  public async setCustomScopeTree(
    request: SetCustomScopeTreeRequest,
  ): Promise<SetCustomScopeTreeResponse> {
    const context = {
      namespace: this.namespace,
      cacheTimeout: this.cacheTimeout,
    };

    return await setCustomScopeTreeModule(context, request);
  }
}
