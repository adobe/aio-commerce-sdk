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

import { getLogger } from "../../utils/logger";
import { getSharedFiles, getSharedState } from "../../utils/repository";
import { generateUUID } from "../../utils/uuid";

import type { ScopeNode, ScopeTree } from "./types";

/**
 * Get cached scope tree from state store
 */
export async function getCachedScopeTree(
  namespace: string,
): Promise<ScopeNode[] | null> {
  try {
    const state = await getSharedState();
    const cached = await state.get(`${namespace}:scope-tree`);
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
 * Cache scope tree in state store with TTL
 */
export async function setCachedScopeTree(
  namespace: string,
  data: ScopeNode[],
  ttlSeconds: number,
): Promise<void> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:scope-tree-repository",
  );
  try {
    const state = await getSharedState();
    await state.put(`${namespace}:scope-tree`, JSON.stringify({ data }), {
      ttl: ttlSeconds,
    });
  } catch (error) {
    logger.debug(
      "Error caching scope tree:",
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - caching failure shouldn't break functionality
  }
}

/**
 * Get persisted scope tree from files
 */
export async function getPersistedScopeTree(
  namespace: string,
): Promise<ScopeTree> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:scope-tree-repository",
  );
  try {
    const files = await getSharedFiles();
    const filePath = generateScopeFilePath(namespace);

    try {
      const content = await files.read(filePath);
      const data = JSON.parse(content.toString());
      return data.scopes as ScopeTree;
    } catch (_readError) {
      // File doesn't exist, create and return initial tree
      const initialTree = createInitialScopeTree();
      await saveScopeTree(namespace, initialTree);
      return initialTree;
    }
  } catch (error) {
    logger.debug(
      "Error getting scope tree from files:",
      error instanceof Error ? error.message : String(error),
    );
    // Return initial tree as fallback
    return createInitialScopeTree();
  }
}

/**
 * Save scope tree to files
 */
export async function saveScopeTree(
  namespace: string,
  scopes: ScopeTree,
): Promise<void> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:scope-tree-repository",
  );
  try {
    const files = await getSharedFiles();
    const filePath = generateScopeFilePath(namespace);
    const data = {
      scopes,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
    };
    await files.write(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.debug(
      "Error saving scope tree to files:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

function createInitialScopeTree(): ScopeTree {
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

function generateScopeFilePath(namespace: string): string {
  return `${namespace}/scope-tree.json`;
}
