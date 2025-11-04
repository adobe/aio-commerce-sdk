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

import AioLogger from "@adobe/aio-lib-core-logging";
import { init as initFiles } from "@adobe/aio-lib-files";
import { init as initState } from "@adobe/aio-lib-state";

import type { Files } from "@adobe/aio-lib-files";
import type { AdobeState } from "@adobe/aio-lib-state";

const logger = AioLogger(
  "@adobe/aio-commerce-lib-config:configuration-repository",
  { level: process.env.LOG_LEVEL ?? "info" },
);

/**
 * Repository for all configuration data related operations
 * Handles both state (caching) and files (persistence) operations
 */

export class ConfigurationRepository {
  private __state: AdobeState | null;
  private __files: Files | null;

  public constructor(state?: AdobeState, files?: Files) {
    this.__state = state ?? null;
    this.__files = files ?? null;
  }

  private async getState() {
    if (!this.__state) {
      this.__state = await initState();
    }

    return this.__state;
  }

  private async getFiles() {
    if (!this.__files) {
      this.__files = await initFiles();
    }

    return this.__files;
  }

  /**
   * Get cached configuration payload from state store
   */
  public async getCachedConfig(scopeCode: string) {
    try {
      const state = await this.getState();
      const key = this.getConfigStateKey(scopeCode);
      const result = await state.get(key);
      if (result.value) {
        const parsed = JSON.parse(result.value);
        return parsed.data || null;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Cache configuration payload in state store
   */
  public async setCachedConfig(scopeCode: string, payload: string) {
    try {
      const state = await this.getState();
      const key = this.getConfigStateKey(scopeCode);
      await state.put(key, JSON.stringify({ data: payload }));
    } catch (error) {
      logger.debug(
        "Failed to cache configuration:",
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw - caching failure shouldn't break functionality
    }
  }

  /**
   * Get persisted configuration payload from files
   */
  public async getPersistedConfig(scopeCode: string) {
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
    } catch (_) {
      return null;
    }
  }

  /**
   * Save configuration payload to files
   */
  public async saveConfig(scopeCode: string, payload: string) {
    const files = await this.getFiles();
    const filePath = this.getConfigFilePath(scopeCode);
    await files.write(filePath, payload);
  }

  /**
   * Try to load configuration from state cache
   * @param scopeCode - The scope code to load configuration for
   * @returns The parsed configuration or null if not found
   */
  private async loadFromStateCache(scopeCode: string) {
    try {
      const statePayload = await this.getCachedConfig(scopeCode);
      if (statePayload) {
        return JSON.parse(statePayload);
      }
    } catch (err) {
      logger.debug("Failed to load configuration from state cache", {
        scopeCode,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return null;
  }

  /**
   * Check if error is a not-found error
   */
  private isNotFoundError(err: unknown): boolean {
    const statusNotFound = 404;
    return (
      typeof err === "object" &&
      err !== null &&
      (("statusCode" in err && err.statusCode === statusNotFound) ||
        ("code" in err && err.code === "ENOENT"))
    );
  }

  /**
   * Try to load configuration from persisted files
   * @param scopeCode - The scope code to load configuration for
   * @returns The parsed configuration or null if not found
   */
  private async loadFromPersistedFiles(scopeCode: string) {
    try {
      const filePayload = await this.getPersistedConfig(scopeCode);
      if (!filePayload) {
        return null;
      }

      const parsed = JSON.parse(filePayload);

      // Try to cache the file data for future reads
      try {
        await this.setCachedConfig(scopeCode, JSON.stringify(parsed));
      } catch (err) {
        logger.debug("Failed to cache configuration in state", {
          scopeCode,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      return parsed;
    } catch (err) {
      if (this.isNotFoundError(err)) {
        logger.debug(
          `No persisted configuration file found for scope ${scopeCode}.`,
        );
      } else {
        logger.debug(
          `Failed to retrieve configuration from files for scope ${scopeCode}:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    return null;
  }

  /**
   * Load configuration with smart fallback strategy (state -> files -> cache)
   * @param scopeCode - The scope code to load configuration for
   * @returns The configuration payload or null if not found
   */
  public async loadConfig(scopeCode: string) {
    const fromState = await this.loadFromStateCache(scopeCode);
    if (fromState) {
      return fromState;
    }

    const fromFiles = await this.loadFromPersistedFiles(scopeCode);
    if (fromFiles) {
      return fromFiles;
    }

    return null;
  }

  /**
   * Persist configuration with caching strategy (files + state cache)
   * @param scopeCode - The scope code to persist configuration for
   * @param payload - The configuration payload object
   */
  public async persistConfig(scopeCode: string, payload: unknown) {
    const payloadString = JSON.stringify(payload);

    // Always save to files (primary persistence)
    await this.saveConfig(scopeCode, payloadString);

    // Try to cache in state for faster reads
    try {
      await this.setCachedConfig(scopeCode, payloadString);
    } catch (e) {
      logger.debug("Failed to cache configuration in state", {
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
