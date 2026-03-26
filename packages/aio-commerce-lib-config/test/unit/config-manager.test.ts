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

import * as commerceApi from "#api/commerce";
import {
  getScopeTree,
  initialize,
  setCustomScopeTree,
  syncCommerceScopes,
  unsyncCommerceScopes,
} from "#config-manager";
import * as schemaRepository from "#modules/schema/config-schema-repository";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { BusinessConfigSchema } from "#index";
import type { ScopeTree } from "#modules/scope-tree/types";

vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  getCachedScopeTree: vi.fn(() => Promise.resolve(null)),
  getPersistedScopeTree: vi.fn(() => Promise.resolve(mockScopeTree)),
  setCachedScopeTree: vi.fn(() => Promise.resolve()),
  deleteCachedScopeTree: vi.fn(() => Promise.resolve()),
  saveScopeTree: vi.fn(() => Promise.resolve()),
}));

vi.mock("#api/commerce", () => ({
  getAllScopeData: vi.fn(() =>
    Promise.resolve({
      websites: [],
      storeGroups: [],
      storeViews: [],
    }),
  ),
}));

vi.mock("#modules/schema/config-schema-repository", () => {
  const mockSchema = JSON.stringify([
    {
      name: "exampleList",
      type: "list",
      selectionMode: "single",
      options: [{ label: "Option 1", value: "option1" }],
      default: "option1",
    },
    {
      name: "currency",
      type: "text",
      label: "Currency",
      default: "",
    },
  ]);

  return {
    getCachedSchema: vi.fn(() => Promise.resolve(null)),
    setCachedSchema: vi.fn(() => Promise.resolve()),
    deleteCachedSchema: vi.fn(() => Promise.resolve()),
    getPersistedSchema: vi.fn(() => Promise.resolve(mockSchema)),
    savePersistedSchema: vi.fn(() => Promise.resolve()),
    getSchemaVersion: vi.fn(() => Promise.resolve(null)),
    setSchemaVersion: vi.fn(() => Promise.resolve()),
  };
});

describe("unsyncCommerceScopes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns { unsynced: true } when commerce scope exists and is removed", async () => {
    const scopeTreeWithCommerce: ScopeTree = [...mockScopeTree];
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      scopeTreeWithCommerce,
    );

    const { unsynced } = await unsyncCommerceScopes();
    expect(unsynced).toBe(true);

    expect(scopeTreeRepository.saveScopeTree).toHaveBeenCalledTimes(1);
    const savedScopeTree = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0][1];

    expect(savedScopeTree).toEqual(
      mockScopeTree.filter((scope) => scope.code !== "commerce"),
    );

    expect(savedScopeTree.find((scope) => scope.code === "commerce")).toBe(
      undefined,
    );
  });

  test("returns { unsynced: false } when commerce scope does not exist", async () => {
    const scopeTreeWithoutCommerce: ScopeTree = mockScopeTree.filter(
      (scope) => scope.code !== "commerce",
    );

    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      scopeTreeWithoutCommerce,
    );

    const { unsynced } = await unsyncCommerceScopes();

    expect(unsynced).toBe(false);
    expect(scopeTreeRepository.saveScopeTree).not.toHaveBeenCalled();
  });

  test("error is thrown when persistent storage access fails", async () => {
    const error = new Error("Failed to access persistent storage");
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockRejectedValue(
      error,
    );

    await expect(unsyncCommerceScopes()).rejects.toThrow(
      "Failed to access persistent storage",
    );

    expect(scopeTreeRepository.saveScopeTree).not.toHaveBeenCalled();
  });
});

describe("initialize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should initialize schema when schema is provided", async () => {
    const testSchema = [
      {
        name: "testField",
        type: "text",
        label: "Test Field",
        default: "test",
      },
    ] satisfies BusinessConfigSchema;

    await initialize({ schema: testSchema });

    expect(schemaRepository.savePersistedSchema).toHaveBeenCalledTimes(1);
    expect(schemaRepository.savePersistedSchema).toHaveBeenCalledWith(
      expect.any(String),
      testSchema,
      expect.any(String),
    );
  });

  test("should not throw when stored schema exists and no schema provided", async () => {
    vi.mocked(schemaRepository.getPersistedSchema).mockResolvedValue(
      JSON.stringify([
        { name: "existing", type: "text", default: "" },
      ] satisfies BusinessConfigSchema),
    );

    await expect(initialize({})).resolves.not.toThrow();
  });

  test("should throw error when no schema provided and no stored schema exists", async () => {
    vi.mocked(schemaRepository.getPersistedSchema).mockResolvedValue("");

    await expect(initialize({})).rejects.toThrow();
  });

  test("should not save schema if version matches existing schema", async () => {
    const existingSchema = [
      { name: "field1", type: "text", default: "" },
    ] satisfies BusinessConfigSchema;

    vi.mocked(schemaRepository.getPersistedSchema).mockResolvedValue(
      JSON.stringify(existingSchema),
    );

    await initialize({ schema: existingSchema });

    // Should not save if versions match
    expect(schemaRepository.savePersistedSchema).not.toHaveBeenCalled();
  });
});

describe("getScopeTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return cached scope tree when no params provided", async () => {
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await getScopeTree();

    expect(result.scopeTree).toEqual(mockScopeTree);
    expect(result.isCachedData).toBe(true);
    expect(scopeTreeRepository.getCachedScopeTree).toHaveBeenCalledWith(
      expect.any(String),
    );
  });

  test("should fallback to persisted tree when cache is empty", async () => {
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockResolvedValue(null);
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await getScopeTree();

    expect(result.scopeTree).toEqual(mockScopeTree);
    expect(result.isCachedData).toBe(true);
    expect(scopeTreeRepository.setCachedScopeTree).toHaveBeenCalled();
  });

  test("should use custom cache timeout when provided", async () => {
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockResolvedValue(null);
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    await getScopeTree(undefined, { cacheTimeout: 600_000 });

    expect(scopeTreeRepository.setCachedScopeTree).toHaveBeenCalledWith(
      expect.any(String),
      mockScopeTree,
      600_000,
    );
  });
});

describe("syncCommerceScopes", () => {
  const commerceConfig: CommerceHttpClientParams = {
    config: {
      baseUrl: "https://test.commerce.com",
      flavor: "saas",
    },
    auth: {
      clientId: "test-client-id",
      clientSecrets: ["test-client-secret"],
      technicalAccountId: "test-technical-account-id",
      technicalAccountEmail: "test-technical-account-email",
      imsOrgId: "test-ims-org-id",
      environment: "prod",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should sync commerce scopes successfully with fresh data", async () => {
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await syncCommerceScopes(commerceConfig);

    expect(result.synced).toBe(true);
    expect(result.scopeTree).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(commerceApi.getAllScopeData).toHaveBeenCalled();
    expect(scopeTreeRepository.saveScopeTree).toHaveBeenCalled();
    expect(scopeTreeRepository.setCachedScopeTree).toHaveBeenCalled();
  });

  test("should return synced=false when API fails and uses fallback cached data", async () => {
    const apiError = new Error("Commerce API error");
    vi.mocked(commerceApi.getAllScopeData).mockRejectedValue(apiError);
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await syncCommerceScopes(commerceConfig);

    expect(result.synced).toBe(false);
    expect(result.scopeTree).toEqual(mockScopeTree);
    expect(result.error).toBeDefined();
  });

  test("should include error when fallback persisted data is used", async () => {
    const apiError = new Error("Commerce API error");
    vi.mocked(commerceApi.getAllScopeData).mockRejectedValue(apiError);
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockResolvedValue(null);
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await syncCommerceScopes(commerceConfig);

    expect(result.scopeTree).toEqual(mockScopeTree);
    expect(result.synced).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("should throw error when sync fails completely", async () => {
    const error = new Error("Network failure");
    vi.mocked(commerceApi.getAllScopeData).mockRejectedValue(error);
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockRejectedValue(error);
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockRejectedValue(
      error,
    );

    await expect(syncCommerceScopes(commerceConfig)).rejects.toThrow();
  });

  test("should use custom cache timeout when provided", async () => {
    vi.mocked(commerceApi.getAllScopeData).mockResolvedValue({
      websites: [],
      storeGroups: [],
      storeViews: [],
    });
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    await syncCommerceScopes(commerceConfig, { cacheTimeout: 600_000 });

    expect(scopeTreeRepository.setCachedScopeTree).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      600_000,
    );
  });

  test("should handle unknown error types", async () => {
    vi.mocked(commerceApi.getAllScopeData).mockRejectedValue("String error");
    vi.mocked(scopeTreeRepository.getCachedScopeTree).mockRejectedValue(
      "String error",
    );
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockRejectedValue(
      "String error",
    );

    await expect(syncCommerceScopes(commerceConfig)).rejects.toThrow();
  });
});

describe("setCustomScopeTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should set custom scopes successfully", async () => {
    const customScopes = [
      {
        code: "region_us",
        label: "US Region",
        level: "custom",
        is_editable: true,
        is_final: false,
        children: [
          {
            code: "region_us_west",
            label: "US West",
            level: "custom",
            is_editable: true,
            is_final: true,
          },
        ],
      },
    ];

    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await setCustomScopeTree({ scopes: customScopes });

    expect(result.message).toBeDefined();
    expect(result.scopes).toHaveLength(1);
    expect(result.scopes[0].code).toBe("region_us");
    expect(result.scopes[0].children).toHaveLength(1);
    expect(scopeTreeRepository.saveScopeTree).toHaveBeenCalled();
    expect(scopeTreeRepository.deleteCachedScopeTree).toHaveBeenCalledWith(
      expect.any(String),
    );
  });

  test("should preserve existing IDs when updating scopes with same code and level", async () => {
    const existingCustomScopes: ScopeTree = [
      ...mockScopeTree,
      {
        id: "existing-custom-id",
        code: "region_eu",
        label: "Old EU Region",
        level: "custom",
        is_editable: true,
        is_final: false,
        is_removable: true,
      },
    ];

    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      existingCustomScopes,
    );

    const result = await setCustomScopeTree({
      scopes: [
        {
          code: "region_eu",
          label: "European Region",
          level: "custom",
          is_editable: true,
          is_final: false,
        },
      ],
    });

    expect(result.scopes[0].id).toBe("existing-custom-id");
    expect(result.scopes[0].label).toBe("European Region");
  });

  test("should generate new IDs for new scopes", async () => {
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await setCustomScopeTree({
      scopes: [
        {
          code: "new_region",
          label: "New Region",
          level: "custom",
          is_editable: true,
          is_final: true,
        },
      ],
    });

    expect(result.scopes[0].id).toBeDefined();
  });

  test("should preserve global and commerce scopes", async () => {
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    await setCustomScopeTree({
      scopes: [
        {
          code: "custom_scope",
          label: "Custom Scope",
          level: "custom",
          is_editable: true,
          is_final: true,
        },
      ],
    });

    const savedTree = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0][1];

    expect(savedTree.find((s) => s.code === "global")).toBeDefined();
    expect(savedTree.find((s) => s.code === "commerce")).toBeDefined();
  });

  test("should invalidate cache when custom scopes are updated", async () => {
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    await setCustomScopeTree({
      scopes: [
        {
          code: "region",
          label: "Region",
          level: "custom",
          is_editable: true,
          is_final: true,
        },
      ],
    });

    // Cache should be deleted to ensure fresh data on next getScopeTree call
    expect(scopeTreeRepository.deleteCachedScopeTree).toHaveBeenCalledWith(
      expect.any(String),
    );
    // Should not set cache with the updated tree
    expect(scopeTreeRepository.setCachedScopeTree).not.toHaveBeenCalled();
  });

  test("should handle empty scopes array", async () => {
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      mockScopeTree,
    );

    const result = await setCustomScopeTree({ scopes: [] });

    expect(result.message).toBe("Custom scope tree updated successfully");
    expect(result.scopes).toHaveLength(0);

    const savedTree = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0][1];
    expect(savedTree).toHaveLength(2); // Only global and commerce
    expect(savedTree[0].code).toBe("global");
    expect(savedTree[1].code).toBe("commerce");
  });

  test("should throw when two scopes share the same code and level", async () => {
    await expect(
      setCustomScopeTree({
        scopes: [
          {
            code: "region",
            label: "Region A",
            level: "custom",
            is_editable: true,
            is_final: true,
          },
          {
            code: "region",
            label: "Region B",
            level: "custom",
            is_editable: true,
            is_final: true,
          },
        ],
      }),
    ).rejects.toThrow();
  });

  test("should throw when scope has an id that is blank after trimming", async () => {
    await expect(
      setCustomScopeTree({
        scopes: [
          {
            id: "   ",
            code: "region",
            label: "Region",
            level: "custom",
            is_editable: true,
            is_final: true,
          },
        ],
      }),
    ).rejects.toThrow();
  });

  test("should throw error when validation fails", async () => {
    await expect(
      setCustomScopeTree({
        scopes: [
          {
            code: "global", // Reserved code
            label: "Invalid",
            level: "custom",
            is_editable: true,
            is_final: true,
          },
        ],
      }),
    ).rejects.toThrow();
  });
});
