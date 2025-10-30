/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Files, init as initFiles } from "@adobe/aio-lib-files";
import { AdobeState, init as initState } from "@adobe/aio-lib-state";

// Shared instances to avoid re-initialization
let sharedState: AdobeState | undefined;
let sharedFiles: Files | undefined;

/**
 * Repository for all configuration data related operations
 * Handles both state (caching) and files (persistence) operations
 */
export class ConfigurationRepository {
  private async getState(): Promise<AdobeState> {
    if (!sharedState) {
      sharedState = await initState();
    }
    return sharedState;
  }

  private async getFiles(): Promise<Files> {
    if (!sharedFiles) {
      sharedFiles = await initFiles();
    }
    return sharedFiles;
  }

  /**
   * Get cached configuration payload from state store
   */
  async getCachedConfig(scopeCode: string): Promise<any> {
    try {
      const state = await this.getState();
      const key = this.getConfigStateKey(scopeCode);
      const result = await state.get(key);
      return result.value ? JSON.parse(result.value) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache configuration payload in state store
   */
  async setCachedConfig(scopeCode: string, payload: string): Promise<void> {
    try {
      const state = await this.getState();
      const key = this.getConfigStateKey(scopeCode);
      await state.put(key, payload);
    } catch (error) {
      console.error("Error caching configuration:", error);
      // Don't throw - caching failure shouldn't break functionality
    }
  }

  /**
   * Get persisted configuration payload from files
   */
  async getPersistedConfig(scopeCode: string): Promise<string | null> {
    try {
      const files = await this.getFiles();
      const filePath = this.getConfigFilePath(scopeCode);
      const filesList = await files.list("scope/");
      const fileObject = filesList.find((file) => file.name === filePath);

      if (!fileObject) {
        return null;
      }

      const content = await files.read(filePath);
      return content ? content.toString("utf8") : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save configuration payload to files
   */
  async saveConfig(scopeCode: string, payload: string): Promise<void> {
    const files = await this.getFiles();
    const filePath = this.getConfigFilePath(scopeCode);
    await files.write(filePath, payload);
  }

  /**
   * Load configuration with smart fallback strategy (state -> files -> cache)
   * @param scopeCode - The scope code to load configuration for
   * @returns The configuration payload or null if not found
   */
  async loadConfig(
    scopeCode: string,
  ): Promise<{ scope: any; config: any[] } | null> {
    try {
      // Try state cache first
      const statePayload = await this.getCachedConfig(scopeCode);
      if (statePayload) {
        return JSON.parse(statePayload);
      }
    } catch (e: any) {
      console.debug("State read failed, will try files next", {
        scopeCode,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    try {
      // Fallback to persisted files
      const filePayload = await this.getPersistedConfig(scopeCode);
      if (filePayload) {
        const parsed = JSON.parse(filePayload);

        // Try to cache the file data for future reads
        try {
          await this.setCachedConfig(scopeCode, JSON.stringify(parsed));
        } catch (e: any) {
          console.warn("Failed to cache configuration in state", {
            scopeCode,
            error: e instanceof Error ? e.message : String(e),
          });
        }

        return parsed;
      }
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.code === "ENOENT") {
        console.debug(
          `No persisted configuration file found for scope ${scopeCode}.`,
        );
      } else {
        console.error(
          `Error retrieving configuration from files for scope ${scopeCode}:`,
          e,
        );
      }
    }

    return null;
  }

  /**
   * Persist configuration with caching strategy (files + state cache)
   * @param scopeCode - The scope code to persist configuration for
   * @param payload - The configuration payload object
   */
  async persistConfig(scopeCode: string, payload: any): Promise<void> {
    const payloadString = JSON.stringify(payload);

    // Always save to files (primary persistence)
    await this.saveConfig(scopeCode, payloadString);

    // Try to cache in state for faster reads
    try {
      await this.setCachedConfig(scopeCode, payloadString);
    } catch (e: any) {
      console.warn("Failed to cache configuration in state", {
        scopeCode,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private getConfigStateKey(scopeCode: string): string {
    return `configuration.${scopeCode}`;
  }

  private getConfigFilePath(scopeCode: string): string {
    return `scope/${scopeCode.toLowerCase()}/configuration.json`;
  }
}
