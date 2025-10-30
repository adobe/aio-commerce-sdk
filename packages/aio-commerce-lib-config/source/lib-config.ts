import { ConfigManager } from "./config-manager";

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

/**
 * Initialize the configuration library
 * @param config - Optional configuration for the library
 * @returns Initialized configuration instance
 */
export function init(_config?: LibConfig) {
  const configManager = new ConfigManager(_config);

  return {
    /**
     * Get the scope tree
     * @param remoteFetch Whether to fetch Commerce scopes
     * @returns Flattened scope tree as array with metadata about data freshness and any fallback information
     */
    async getScopeTree(remoteFetch = false): Promise<{
      scopeTree: ScopeTree;
      isCachedData: boolean;
      fallbackError?: string;
    }> {
      return await configManager.getScopeTree(remoteFetch);
    },

    /**
     * Sync Commerce scopes forces a fresh fetch from Commerce API
     * @returns Sync result with updated scope tree and sync status
     */
    async syncCommerceScopes(): Promise<{
      scopeTree: ScopeTree;
      synced: boolean;
      error?: string;
    }> {
      return await configManager.syncCommerceScopes();
    },

    /**
     * Get configuration schema
     */
    async getConfigSchema(): Promise<ConfigSchemaField[]> {
      return await configManager.getSchema();
    },

    /**
     * Get configuration.
     */
    async getConfiguration(
      ...args: unknown[]
    ): Promise<GetConfigurationResponse> {
      return await configManager.getConfiguration(...args);
    },

    /**
     * Get specific configuration value by key.
     * @param configKey - The name of the configuration field to retrieve
     * @param args - either (id) or (code, level)
     */
    async getConfigurationByKey(
      configKey: string,
      ...args: unknown[]
    ): Promise<GetConfigurationByKeyResponse> {
      return await configManager.getConfigurationByKey(configKey, ...args);
    },

    /**
     * Set configuration.
     */
    async setConfiguration(
      request: SetConfigurationRequest,
      ...args: unknown[]
    ): Promise<SetConfigurationResponse> {
      return await configManager.setConfiguration(request, ...args);
    },

    /**
     * Set custom scope tree
     * @param request - Custom scopes to set/update
     * @returns Updated custom scope tree with generated IDs and timestamp
     */
    async setCustomScopeTree(
      request: SetCustomScopeTreeRequest,
    ): Promise<SetCustomScopeTreeResponse> {
      return await configManager.setCustomScopeTree(request);
    },
  };
}
