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

import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  buildUpdatedScopeTree,
  mergeCommerceScopes,
} from "#modules/scope-tree/merge-scopes";

import type { ScopeNode, ScopeTree } from "#modules/scope-tree/types";
import type { CommerceScopeData } from "#types/index";

// Constants for magic numbers
const BASE_36 = 36;
const UUID_SUBSTRING_START = 2;
const UUID_SUBSTRING_LENGTH = 9;
const NEW_UUID_REGEX = /^new-uuid-/;

// Mock uuid to have predictable UUIDs in tests
vi.mock("uuid", () => ({
  v4: vi.fn(
    () =>
      `new-uuid-${Math.random().toString(BASE_36).slice(UUID_SUBSTRING_START, UUID_SUBSTRING_LENGTH)}`,
  ),
}));

describe("scope-tree/merge-scopes", () => {
  let mockCommerceFreshData: CommerceScopeData;
  let mockExistingTree: ScopeTree;
  let mockExistingTreeWithCommerceScopes: ScopeTree;

  beforeEach(() => {
    // Fresh Commerce API data
    mockCommerceFreshData = {
      storeGroups: [
        {
          code: "main_store",
          default_store_id: 1,
          id: 1,
          name: "Main Store",
          root_category_id: 2,
          website_id: 1,
        },
        {
          code: "second_store",
          default_store_id: 2,
          id: 2,
          name: "Second Store",
          root_category_id: 3,
          website_id: 2,
        },
      ],
      storeViews: [
        {
          code: "default",
          id: 1,
          is_active: true,
          name: "Default Store View",
          store_group_id: 1,
          website_id: 1,
        },
        {
          code: "second_view",
          id: 2,
          is_active: true,
          name: "Second Store View",
          store_group_id: 2,
          website_id: 2,
        },
      ],
      websites: [
        {
          code: "main",
          default_group_id: 1,
          id: 1,
          name: "Main Website",
        },
        {
          code: "second",
          default_group_id: 2,
          id: 2,
          name: "Second Website",
        },
      ],
    };

    // Existing tree with no commerce scopes
    mockExistingTree = [
      {
        code: "global",
        id: "global-uuid-123",
        is_editable: false,
        is_final: true,
        is_removable: false,
        label: "Global",
        level: "global",
      },
    ];

    // Existing tree with some commerce scopes (to test UUID preservation)
    mockExistingTreeWithCommerceScopes = [
      {
        code: "global",
        id: "global-uuid-123",
        is_editable: false,
        is_final: true,
        is_removable: false,
        label: "Global",
        level: "global",
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    code: "default",
                    commerce_id: 1,
                    id: "existing-store-view-uuid-101",
                    is_editable: false,
                    is_final: true,
                    is_removable: false,
                    label: "Old Default Store View",
                    level: "store_view",
                  },
                ],
                code: "main_store",
                commerce_id: 1,
                id: "existing-store-group-uuid-789",
                is_editable: false,
                is_final: false,
                is_removable: false,
                label: "Old Main Store Name",
                level: "store",
              },
            ],
            code: "main",
            commerce_id: 1,
            id: "existing-website-uuid-456",
            is_editable: false,
            is_final: false,
            is_removable: false,
            label: "Old Main Website Name",
            level: "website",
          },
        ],
        code: "commerce",
        id: "commerce-parent-uuid",
        is_editable: false,
        is_final: true,
        is_removable: false,
        label: "Commerce",
        level: "commerce",
      },
    ];
  });

  describe("mergeCommerceScopes", () => {
    test("should create new commerce scopes when none exist", () => {
      const result = mergeCommerceScopes(
        mockCommerceFreshData,
        mockExistingTree,
      );

      expect(result).toHaveLength(2); // Two websites
      expect(result[0]).toMatchObject({
        code: "main",
        commerce_id: 1,
        is_editable: true,
        is_final: true,
        label: "Main Website",
        level: "website",
      });
      expect(result[0].id).toMatch(NEW_UUID_REGEX); // New UUID generated
      expect(result[0].children).toHaveLength(1); // One store group
      expect(result[0].children?.[0].children).toHaveLength(1); // One store view
    });

    test("should preserve existing UUIDs when merging with existing commerce scopes", () => {
      const result = mergeCommerceScopes(
        mockCommerceFreshData,
        mockExistingTreeWithCommerceScopes,
      );

      expect(result).toHaveLength(2); // Two websites

      // First website should preserve existing UUID but update data
      const firstWebsite = result.find((w) => w.commerce_id === 1);
      expect(firstWebsite).toBeDefined();
      expect(firstWebsite?.id).toBe("existing-website-uuid-456");
      expect(firstWebsite?.label).toBe("Main Website");
      expect(firstWebsite?.code).toBe("main");

      // Store group should preserve UUID
      const storeGroup = firstWebsite?.children?.[0];
      expect.assert(storeGroup, "storeGroup is not defined/truthy");
      expect(storeGroup.id).toBe("existing-store-group-uuid-789");
      expect(storeGroup.label).toBe("Main Store");

      // Store view should preserve UUID
      const storeView = storeGroup?.children?.[0];
      expect.assert(storeView, "storeView is not defined/truthy");
      expect(storeView.id).toBe("existing-store-view-uuid-101");
      expect(storeView.label).toBe("Default Store View");

      // Second website should get new UUID (didn't exist before)
      const secondWebsite = result.find((w) => w.commerce_id === 2);
      expect.assert(secondWebsite, "secondWebsite is not defined/truthy");
      expect(secondWebsite.id).toMatch(NEW_UUID_REGEX);
    });

    test("should build correct hierarchical structure", () => {
      const result = mergeCommerceScopes(
        mockCommerceFreshData,
        mockExistingTree,
      );

      const website = result.find((w) => w.commerce_id === 1);
      expect.assert(website, "website is not defined/truthy");

      // Check website structure
      expect(website.level).toBe("website");
      expect(website.is_final).toBe(true);
      expect(website.children).toHaveLength(1);

      // Check store group structure
      const storeGroup = website.children?.[0];
      expect.assert(storeGroup, "storeGroup is not defined/truthy");
      expect(storeGroup.commerce_id).toBe(1);
      expect(storeGroup.level).toBe("store");
      expect(storeGroup.is_final).toBe(true);
      expect(storeGroup.children).toHaveLength(1);

      // Check store view structure
      const storeView = storeGroup.children?.[0];
      expect.assert(storeView, "storeView is not defined/truthy");
      expect(storeView.commerce_id).toBe(1);
      expect(storeView.level).toBe("store_view");
      expect(storeView.is_final).toBe(true);
      expect(storeView.children).toBeUndefined(); // Leaf node
    });
  });

  describe("buildUpdatedScopeTree", () => {
    test("should merge updated commerce scopes with existing tree structure", () => {
      const updatedCommerceScopes: ScopeNode[] = [
        {
          children: [],
          code: "main",
          commerce_id: 1,
          id: "website-uuid-1",
          is_editable: false,
          is_final: false,
          is_removable: false,
          label: "Main Website",
          level: "website",
        },
      ];

      const result = buildUpdatedScopeTree(
        updatedCommerceScopes,
        mockExistingTree,
      );

      // Should preserve global scopes
      const globalNode = result.find((n) => n.code === "global");
      expect(globalNode).toEqual(
        mockExistingTree.find((n) => n.code === "global"),
      );

      // Should update commerce scopes
      const commerceNode = result.find((n) => n.code === "commerce");
      expect(commerceNode?.children).toEqual(updatedCommerceScopes);
    });

    test("should preserve custom systems like akeneo when updating commerce", () => {
      const existingTreeWithCustom: ScopeTree = [
        ...mockExistingTree,
        {
          children: [
            {
              code: "akeneo_master",
              id: "akeneo-uuid-123",
              is_editable: true,
              is_final: false,
              is_removable: true,
              label: "Akeneo Master",
              level: "akeneo_level1",
            },
          ],
          code: "akeneo",
          id: "akeneo-parent-uuid",
          is_editable: false,
          is_final: true,
          is_removable: false,
          label: "Akeneo",
          level: "akeneo",
        },
      ];

      const updatedCommerceScopes: ScopeNode[] = [
        {
          children: [],
          code: "main",
          commerce_id: 1,
          id: "website-uuid-1",
          is_editable: false,
          is_final: false,
          is_removable: false,
          label: "Main Website",
          level: "website",
        },
      ];

      const result = buildUpdatedScopeTree(
        updatedCommerceScopes,
        existingTreeWithCustom,
      );

      // Should preserve all existing systems
      const globalNode = result.find((n) => n.code === "global");
      expect(globalNode).toEqual(
        existingTreeWithCustom.find((n) => n.code === "global"),
      );

      const akeneoNode = result.find((n) => n.code === "akeneo");
      expect(akeneoNode).toEqual(
        existingTreeWithCustom.find((n) => n.code === "akeneo"),
      );

      // Should update only commerce
      const commerceNode = result.find((n) => n.code === "commerce");
      expect(commerceNode?.children).toEqual(updatedCommerceScopes);
    });
  });
});
