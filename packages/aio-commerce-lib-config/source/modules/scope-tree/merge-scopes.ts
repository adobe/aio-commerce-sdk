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

import { generateUUID } from "../../utils/uuid";

import type { CommerceScopeData, StoreGroup, StoreView } from "../../types";
import type { ScopeNode, ScopeTree } from "./types";

/**
 * Transform fresh Commerce API data while preserving existing UUIDs
 * @param freshData - Fresh data from Commerce API
 * @param existingTree - Existing scope tree with UUIDs to preserve
 * @returns Updated Commerce scopes with preserved UUIDs
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
 * Build store groups while preserving UUIDs
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
 * Build store views while preserving UUIDs
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
 * Find existing scope by commerce_id and level to preserve UUID
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
 * Merge updated Commerce scopes with existing custom scopes
 * @param updatedCommerceScopes Fresh Commerce scopes with preserved UUIDs
 * @param existingTree Existing complete scope tree
 * @returns Complete merged scope tree
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
