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
import type { ConfigSchemaField } from "./types";

const logger = AioLogger(
  "@adobe/aio-commerce-lib-config:config-schema-repository",
  { level: process.env.LOG_LEVEL ?? "info" },
);

// Shared instances to avoid re-initialization
let sharedState: AdobeState | undefined;
let sharedFiles: Files | undefined;

/**
 * Repository for all configuration schema related operations
 * Handles both state (caching) and files (persistence) operations
 */
export class ConfigSchemaRepository {
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
   * Get cached schema from state store
   */
  public async getCachedSchema(
    namespace: string,
  ): Promise<ConfigSchemaField[] | null> {
    try {
      const state = await this.getState();
      const cached = await state.get(`${namespace}:config-schema`);
      if (cached?.value) {
        const parsed = JSON.parse(cached.value);
        return parsed.data || null;
      }
      return null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Cache schema in state store with TTL
   */
  public async setCachedSchema(
    namespace: string,
    data: ConfigSchemaField[],
    ttl: number,
  ): Promise<void> {
    try {
      const state = await this.getState();
      await state.put(`${namespace}:config-schema`, JSON.stringify({ data }), {
        ttl,
      });
    } catch (error) {
      logger.debug(
        "Failed to cache schema:",
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw - caching failure shouldn't break functionality
    }
  }

  /**
   * Delete cached schema from state store
   */
  public async deleteCachedSchema(namespace: string): Promise<void> {
    try {
      const state = await this.getState();
      await state.delete(`${namespace}:config-schema`);
    } catch (error) {
      logger.debug(
        "Failed to delete cached schema:",
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw - cache deletion failure shouldn't break functionality
    }
  }

  /**
   * Get cached schema version
   */
  public async getSchemaVersion(namespace: string): Promise<string | null> {
    try {
      const state = await this.getState();
      const versionData = await state.get(`${namespace}:schema-version`);
      if (versionData?.value) {
        const parsed = JSON.parse(versionData.value);
        return parsed.version || null;
      }
      return null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Set schema version
   */
  public async setSchemaVersion(
    namespace: string,
    version: string,
  ): Promise<void> {
    try {
      const state = await this.getState();
      await state.put(
        `${namespace}:schema-version`,
        JSON.stringify({ version }),
      );
    } catch (error) {
      logger.debug(
        "Failed to set schema version:",
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw - version tracking failure shouldn't break functionality
    }
  }

  /**
   * Read persisted schema from files
   */
  public async getPersistedSchema(): Promise<string> {
    const files = await this.getFiles();
    const buffer: Buffer = await files.read("config-schema.json");
    return buffer.toString();
  }

  /**
   * Save schema to files
   */
  public async saveSchema(schema: string): Promise<void> {
    const files = await this.getFiles();
    await files.write("config-schema.json", schema);
  }
}
