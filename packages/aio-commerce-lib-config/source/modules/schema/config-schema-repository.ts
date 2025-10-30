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

import type { ConfigSchemaField } from "./types";

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
  async getCachedSchema(
    namespace: string,
  ): Promise<ConfigSchemaField[] | null> {
    try {
      const state = await this.getState();
      const cached = await state.get(`${namespace}:config-schema`);
      return cached?.value ? JSON.parse(cached.value) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache schema in state store with TTL
   */
  async setCachedSchema(
    namespace: string,
    data: ConfigSchemaField[],
    ttl: number,
  ): Promise<void> {
    try {
      const state = await this.getState();
      await state.put(`${namespace}:config-schema`, JSON.stringify(data), {
        ttl,
      });
    } catch (error) {
      console.error("Error caching schema:", error);
      // Don't throw - caching failure shouldn't break functionality
    }
  }

  /**
   * Delete cached schema from state store
   */
  async deleteCachedSchema(namespace: string): Promise<void> {
    try {
      const state = await this.getState();
      await state.delete(`${namespace}:config-schema`);
    } catch (error) {
      console.error("Error deleting cached schema:", error);
      // Don't throw - cache deletion failure shouldn't break functionality
    }
  }

  /**
   * Get cached schema version
   */
  async getSchemaVersion(namespace: string): Promise<string | null> {
    try {
      const state = await this.getState();
      const versionData = await state.get(`${namespace}:schema-version`);
      return versionData?.value ? JSON.parse(versionData.value).version : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set schema version
   */
  async setSchemaVersion(namespace: string, version: string): Promise<void> {
    try {
      const state = await this.getState();
      await state.put(
        `${namespace}:schema-version`,
        JSON.stringify({ version }),
      );
    } catch (error) {
      console.error("Error setting schema version:", error);
      // Don't throw - version tracking failure shouldn't break functionality
    }
  }

  /**
   * Read persisted schema from files
   */
  async getPersistedSchema(): Promise<string> {
    const files = await this.getFiles();
    const buffer: Buffer = await files.read("config-schema.json");
    return buffer.toString();
  }

  /**
   * Save schema to files
   */
  async saveSchema(schema: string): Promise<void> {
    const files = await this.getFiles();
    await files.write("config-schema.json", schema);
  }
}
