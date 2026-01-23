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

import { generateUUID } from "#utils/uuid";

import type { CommerceScopeData, StoreGroup, StoreView } from "#types/index";
import type { ScopeNode, ScopeTree } from "./types";

/**
 * Merges fresh Commerce API data with existing scope tree while preserving existing UUIDs.
 *
 * This function transforms Commerce API scope data (websites, store groups, store views)
 * into scope nodes while preserving UUIDs from the existing tree when possible. This ensures
 * that scope IDs remain stable across sync operations. UUIDs are matched by `commerce_id`
 * and `level` combination.
 *
 * @param freshData - Fresh data from Commerce API containing websites, store groups, and store views.
 * @param existingTree - Existing scope tree with UUIDs to preserve.
 * @returns Updated Commerce scopes with preserved UUIDs.
 *
 * @example
 * ```typescript
 * import { mergeCommerceScopes } from "./modules/scope-tree";
 * import type { CommerceScopeData } from "../../types";
 * import type { ScopeTree } from "./types";
 *
 * const freshData: CommerceScopeData = {
 *   websites: [{ id: 1, code: "main", name: "Main Website", default_group_id: 1 }],
 *   storeGroups: [{ id: 1, website_id: 1, root_category_id: 2, default_store_id: 1, name: "Main Store", code: "main_store" }],
 *   storeViews: [{ id: 1, code: "default", name: "Default Store View", website_id: 1, store_group_id: 1, is_active: true }],
 * };
 *
 * const existingTree: ScopeTree = [
 *   {
 *     id: "existing-uuid-123",
 *     code: "commerce",
 *     children: [
 *       {
 *         id: "existing-website-uuid",
 *         commerce_id: 1,
 *         code: "main",
 *         level: "website",
 *         // ... other properties
 *       },
 *     ],
 *   },
 * ];
 *
 * // Returns scopes with preserved UUIDs where commerce_id matches
 * const updatedScopes = mergeCommerceScopes(freshData, existingTree);
 * // existing-website-uuid is preserved because commerce_id: 1 matches
 * ```
 */
export function mergeCommerceScopes(
  freshData: CommerceScopeData,
  existingTree: ScopeTree,
): ScopeNode[] {
  const commerceNode = existingTree.find((node) => node.code === "commerce");
  const existingCommerceScopes = commerceNode?.children || [];
  const { websites, storeGroups, storeViews } = freshData;

  return websites.map((website) => {
    // Find existing website by commerce_id to preserve UUID
    const existingWebsite = findScopeByCommerceId(
      existingCommerceScopes,
      website.id,
      "website",
    );

    return {
      id: existingWebsite?.id || generateUUID(),
      commerce_id: website.id,
      code: website.code,
      label: website.name,
      level: "website",
      is_editable: true,
      is_final: true,
      is_removable: false, // Commerce websites cannot be removed
      children: buildStoreGroups(
        storeGroups.filter((sg) => sg.website_id === website.id),
        storeViews,
        existingWebsite?.children || [],
      ),
    };
  });
}

/**
 * Builds store groups while preserving UUIDs.
 *
 * @param storeGroups - Store groups from Commerce API.
 * @param allStoreViews - All store views from Commerce API.
 * @param existingStoreGroups - Existing store group nodes with UUIDs to preserve.
 * @returns Array of store group scope nodes with preserved UUIDs.
 */
function buildStoreGroups(
  storeGroups: StoreGroup[],
  allStoreViews: StoreView[],
  existingStoreGroups: ScopeNode[],
): ScopeNode[] {
  return storeGroups.map((storeGroup) => {
    const existing = findScopeByCommerceId(
      existingStoreGroups,
      storeGroup.id,
      "store",
    );

    return {
      id: existing?.id || generateUUID(),
      commerce_id: storeGroup.id,
      code: storeGroup.code,
      label: storeGroup.name,
      level: "store",
      is_editable: false, // Store groups typically not directly editable
      is_final: true,
      is_removable: false, // Store groups cannot be removed
      children: buildStoreViews(
        allStoreViews.filter((sv) => sv.store_group_id === storeGroup.id),
        existing?.children || [],
      ),
    };
  });
}

/**
 * Builds store views while preserving UUIDs.
 *
 * @param storeViews - Store views from Commerce API.
 * @param existingStoreViews - Existing store view nodes with UUIDs to preserve.
 * @returns Array of store view scope nodes with preserved UUIDs.
 */
function buildStoreViews(
  storeViews: StoreView[],
  existingStoreViews: ScopeNode[],
): ScopeNode[] {
  return storeViews.map((storeView) => {
    const existing = findScopeByCommerceId(
      existingStoreViews,
      storeView.id,
      "store_view",
    );

    return {
      id: existing?.id || generateUUID(),
      commerce_id: storeView.id,
      code: storeView.code,
      label: storeView.name,
      level: "store_view",
      is_editable: true,
      is_final: true, // Leaf nodes
      is_removable: false, // Commerce store views cannot be removed
    };
  });
}

/**
 * Finds existing scope by commerce_id and level to preserve UUID.
 *
 * @param scopes - Array of scope nodes to search.
 * @param commerceId - Commerce API ID to match.
 * @param level - Scope level to match.
 * @returns Matching scope node or undefined if not found.
 */
function findScopeByCommerceId(
  scopes: ScopeNode[],
  commerceId: number,
  level: string,
): ScopeNode | undefined {
  return scopes.find(
    (scope) => scope.commerce_id === commerceId && scope.level === level,
  );
}

/**
 * Builds an updated complete scope tree by merging updated Commerce scopes with existing custom scopes.
 *
 * This function takes updated Commerce scopes and merges them into the existing complete scope tree,
 * preserving all system scopes (global) and custom scopes while updating only the Commerce scopes.
 * If a "commerce" node doesn't exist, it will be created.
 *
 * @param updatedCommerceScopes - Fresh Commerce scopes with preserved UUIDs.
 * @param existingTree - Existing complete scope tree.
 * @returns Complete merged scope tree with updated Commerce scopes.
 *
 * @example
 * ```typescript
 * import { buildUpdatedScopeTree } from "./modules/scope-tree";
 * import type { ScopeNode, ScopeTree } from "./types";
 *
 * const updatedCommerceScopes: ScopeNode[] = [
 *   {
 *     id: "website-1",
 *     code: "main",
 *     level: "website",
 *     commerce_id: 1,
 *     label: "Main Website",
 *     is_editable: true,
 *     is_final: true,
 *     is_removable: false,
 *   },
 * ];
 *
 * const existingTree: ScopeTree = [
 *   {
 *     id: "global-1",
 *     code: "global",
 *     level: "global",
 *     label: "Global",
 *     is_editable: false,
 *     is_final: false,
 *     is_removable: false,
 *   },
 *   {
 *     id: "commerce-1",
 *     code: "commerce",
 *     level: "commerce",
 *     label: "Commerce",
 *     is_editable: false,
 *     is_final: true,
 *     is_removable: false,
 *     children: [],
 *   },
 *   {
 *     id: "custom-1",
 *     code: "region_us",
 *     level: "custom",
 *     label: "US Region",
 *     is_editable: true,
 *     is_final: false,
 *     is_removable: true,
 *   },
 * ];
 *
 * // Returns tree with updated Commerce scopes, preserving global and custom scopes
 * const mergedTree = buildUpdatedScopeTree(updatedCommerceScopes, existingTree);
 * // mergedTree[0] = global scope (unchanged)
 * // mergedTree[1] = commerce scope (updated with new children)
 * // mergedTree[2] = custom scope (unchanged)
 * ```
 */
export function buildUpdatedScopeTree(
  updatedCommerceScopes: ScopeNode[],
  existingTree: ScopeTree,
): ScopeTree {
  // Return complete tree with updated Commerce scopes
  // All other systems (global, custom) remain unchanged
  const hasCommerceNode = existingTree.some((node) => node.code === "commerce");

  if (!hasCommerceNode) {
    return [
      ...existingTree,
      {
        id: generateUUID(),
        code: "commerce",
        label: "Commerce",
        level: "commerce",
        is_editable: false,
        is_removable: false,
        is_final: true,
        children: updatedCommerceScopes,
      },
    ];
  }

  return existingTree.map((node) => {
    if (node.code === "commerce") {
      return {
        ...node,
        children: updatedCommerceScopes,
      };
    }
    return node;
  });
}
