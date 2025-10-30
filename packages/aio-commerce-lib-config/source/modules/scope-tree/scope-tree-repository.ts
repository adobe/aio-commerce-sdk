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

import { generateUUID } from "../../utils/uuid";

import type { ScopeNode, ScopeTree } from "./types";

// Shared instances to avoid re-initialization
let sharedState: AdobeState | undefined;
let sharedFiles: Files | undefined;

/**
 * Repository for all scope tree related operations
 * Handles both state (caching) and files (persistence) operations
 */
export class ScopeTreeRepository {
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
   * Get cached scope tree from state store
   */
  async getCachedScopeTree(namespace: string): Promise<ScopeNode[] | null> {
    try {
      const state = await this.getState();
      const cached = await state.get(`${namespace}:scope-tree`);
      return cached?.value ? JSON.parse(cached.value) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache scope tree in state store with TTL
   */
  async setCachedScopeTree(
    namespace: string,
    data: ScopeNode[],
    ttlSeconds: number,
  ): Promise<void> {
    try {
      const state = await this.getState();
      await state.put(`${namespace}:scope-tree`, JSON.stringify(data), {
        ttl: ttlSeconds,
      });
    } catch (error) {
      console.error("Error caching scope tree:", error);
      // Don't throw - caching failure shouldn't break functionality
    }
  }

  /**
   * Get persisted scope tree from files
   */
  async getPersistedScopeTree(namespace: string): Promise<ScopeTree> {
    try {
      const files = await this.getFiles();
      const filePath = this.generateScopeFilePath(namespace);

      try {
        const content = await files.read(filePath);
        const data = JSON.parse(content.toString());
        return data.scopes as ScopeTree;
      } catch (readError) {
        // File doesn't exist, create and return initial tree
        const initialTree = this.createInitialScopeTree();
        await this.saveScopeTree(namespace, initialTree);
        return initialTree;
      }
    } catch (error) {
      console.error("Error getting scope tree from files:", error);
      // Return initial tree as fallback
      return this.createInitialScopeTree();
    }
  }

  /**
   * Save scope tree to files
   */
  async saveScopeTree(namespace: string, scopes: ScopeTree): Promise<void> {
    try {
      const files = await this.getFiles();
      const filePath = this.generateScopeFilePath(namespace);
      const data = {
        scopes,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      };
      await files.write(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving scope tree to files:", error);
      throw error;
    }
  }

  private createInitialScopeTree(): ScopeTree {
    return [
      {
        id: generateUUID(),
        code: "global",
        label: "Global",
        level: "global",
        is_editable: true,
        is_removable: false,
        is_final: true,
      },
    ];
  }

  private generateScopeFilePath(namespace: string): string {
    return `${namespace}/scope-tree.json`;
  }
}
