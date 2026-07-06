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
  getConfiguration,
  getScopeTree,
  initialize,
  setConfiguration,
  setCustomScopeTree,
  syncCommerceScopes,
  unsyncCommerceScopes,
} from "#config-manager";
import {
  byCodeAndLevel,
  byScopeId,
  byStoreViewId,
  byWebsiteId,
} from "#config-utils";
import * as configRepository from "#modules/configuration/configuration-repository";
import {
  getGlobalSchema,
  setGlobalSchema,
} from "#modules/schema/config-schema-repository";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";
import * as repository from "#utils/repository";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BusinessConfigSchema, ConfigValue } from "#index";
import type { ScopeTree } from "#modules/scope-tree/types";

const INVALID_SCOPE_RE = /INVALID_SCOPE/;

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

// Only the external I/O boundary is mocked — aio-lib-state and aio-lib-files
vi.mock("#utils/repository", () => ({
  getSharedFiles: vi.fn(async () => mockFilesInstance),
  getSharedState: vi.fn(async () => mockStateInstance),
  setGlobalStateOptions: vi.fn(),
}));

vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  deleteCachedScopeTree: vi.fn(() => Promise.resolve()),
  getCachedScopeTree: vi.fn(() => Promise.resolve(null)),
  getPersistedScopeTree: vi.fn(() => Promise.resolve(mockScopeTree)),
  saveScopeTree: vi.fn(() => Promise.resolve()),
  setCachedScopeTree: vi.fn(() => Promise.resolve()),
}));

vi.mock("#api/commerce", () => ({
  getAllScopeData: vi.fn(() =>
    Promise.resolve({
      storeGroups: [],
      storeViews: [],
      websites: [],
    }),
  ),
}));

function buildPayload(
  id: string,
  code: string,
  level: string,
  entries: Array<{
    name: string;
    value: any;
    origin?: { code: string; level: string };
  }>,
) {
  return JSON.stringify({
    config: entries,
    scope: { code, id, level },
  });
}

describe("ConfigManager functions", () => {
  beforeEach(() => {
    // Create fresh mock instances for each test
    // so that each test starts with a clean state
    mockStateInstance = new MockState();
    mockFilesInstance = new MockFiles();

    // Reset all mocks
    vi.clearAllMocks();

    // Set up a default schema for tests
    const defaultSchema = [
      {
        default: "option1",
        name: "exampleList",
        options: [{ label: "Option 1", value: "option1" }],
        selectionMode: "single",
        type: "list",
      },
      {
        default: "",
        label: "Currency",
        name: "currency",
        type: "text",
      },
    ] satisfies BusinessConfigSchema;

    setGlobalSchema(defaultSchema);
  });

  test("throws error when schema not initialized", async () => {
    // @ts-expect-error Clear the schema to simulate not calling initialize
    setGlobalSchema(null);
    await expect(
      getConfiguration(byCodeAndLevel("global", "global")),
    ).rejects.toThrow();
  });

  test("returns defaults when no persisted config", async () => {
    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(result.scope.code).toBe("global");
    expect(Array.isArray(result.config)).toBe(true);
    expect(result.config.length).toBeGreaterThan(0);
  });

  test("reads from state when present", async () => {
    await configRepository.setCachedConfig(
      "global",
      buildPayload("id1", "global", "global", [
        {
          name: "currency",
          origin: { code: "global", level: "global" },
          value: "€",
        },
      ]),
      300,
    );

    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("€");
  });

  test("falls back to files and caches to state", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id2", "global", "global", [
        {
          name: "currency",
          origin: { code: "global", level: "global" },
          value: "£",
        },
      ]),
    );

    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("£");

    // Verify it was cached in state
    const cachedPayload = await configRepository.getCachedConfig("global");
    expect.assert(cachedPayload, "cachedPayload is not defined/truthy");

    const cached = JSON.parse(cachedPayload);
    expect(
      cached.config.find((e: ConfigValue) => e.name === "currency")?.value,
    ).toBe("£");
  });

  test("passes default cacheTimeout as TTL when caching on file fallback", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id1", "global", "global", []),
    );

    await getConfiguration(byCodeAndLevel("global", "global"));

    const putCalls = mockStateInstance.put.mock.calls;
    expect(putCalls.length).toBeGreaterThan(0);
    const ttlValues = putCalls.map((call) => call[2]?.ttl);
    expect(ttlValues.every((ttl) => ttl === 300)).toBe(true);
  });

  test("passes custom cacheTimeout as TTL when caching on file fallback", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id1", "global", "global", []),
    );

    await getConfiguration(byCodeAndLevel("global", "global"), {
      cacheTimeout: 600,
    });

    const putCalls = mockStateInstance.put.mock.calls;
    expect(putCalls.length).toBeGreaterThan(0);
    const ttlValues = putCalls.map((call) => call[2]?.ttl);
    expect(ttlValues.every((ttl) => ttl === 600)).toBe(true);
  });

  test("passes cacheTimeout as TTL when persisting via setConfiguration", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "JPY" }] },
      byCodeAndLevel("global", "global"),
      { cacheTimeout: 120 },
    );

    const putCalls = mockStateInstance.put.mock.calls;
    expect(putCalls.length).toBeGreaterThan(0);
    const ttlValues = putCalls.map((call) => call[2]?.ttl);
    expect(ttlValues.every((ttl) => ttl === 120)).toBe(true);
  });

  test("merges inherited values from parent scopes", async () => {
    // Set up global scope config (top-level parent)
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          origin: { code: "global", level: "global" },
          value: "$",
        },
      ]),
    );

    // Set up intermediate parent scopes in the hierarchy
    await configRepository.saveConfig(
      "commerce",
      buildPayload("id-commerce", "commerce", "commerce", [
        // Commerce inherits currency from global but doesn't override it
      ]),
    );

    await configRepository.saveConfig(
      "base",
      buildPayload("idw", "base", "website", [
        // Base website inherits currency from global but doesn't override it
      ]),
    );

    await configRepository.saveConfig(
      "main_store",
      buildPayload("ids", "main_store", "store", [
        // Store inherits currency from global but doesn't override it
      ]),
    );

    // Set up child scope config with partial override
    await configRepository.saveConfig(
      "default",
      buildPayload("idsv", "default", "store_view", [
        {
          name: "exampleList",
          origin: { code: "default", level: "store_view" },
          value: "option1",
        },
      ]),
    );

    const result = await getConfiguration(
      byCodeAndLevel("default", "store_view"),
    );
    expect(
      result.config.find((e: ConfigValue) => e.name === "currency")?.value,
    ).toBe("$");
    expect(
      result.config.find((e: ConfigValue) => e.name === "currency")?.origin,
    ).toEqual({ code: "global", level: "global" });
    expect(
      result.config.find((e: ConfigValue) => e.name === "exampleList")?.value,
    ).toBe("option1");
    expect(
      result.config.find((e: ConfigValue) => e.name === "exampleList")?.origin,
    ).toEqual({ code: "default", level: "store_view" });
  });

  test("resolves scope by code+level to id and fetches same via id", async () => {
    // Use the correct ID from mock scope tree: 'base'/'website' has id 'idw'
    await configRepository.saveConfig(
      "base",
      buildPayload("idw", "base", "website", [
        {
          name: "currency",
          origin: { code: "base", level: "website" },
          value: "EUR",
        },
      ]),
    );

    const resultByCodeLevel = await getConfiguration(
      byCodeAndLevel("base", "website"),
    );
    const resultById = await getConfiguration(byScopeId("idw"));
    const resultByWebsiteId = await getConfiguration(byWebsiteId(1));

    expect(resultByCodeLevel).toEqual(resultById);
    expect(resultByCodeLevel).toEqual(resultByWebsiteId);
    expect(resultByCodeLevel.scope.id).toBe("idw");
    expect(resultByCodeLevel.scope.code).toBe("base");
    expect(resultByCodeLevel.scope.level).toBe("website");
  });

  test("byWebsiteId and byStoreViewId resolve different scopes that share commerce_id=1", async () => {
    // mockScopeTree has commerce_id=1 on website, store, and store_view
    await configRepository.saveConfig(
      "base",
      buildPayload("idw", "base", "website", [
        {
          name: "currency",
          origin: { code: "base", level: "website" },
          value: "EUR",
        },
      ]),
    );
    await configRepository.saveConfig(
      "default",
      buildPayload("idsv", "default", "store_view", [
        {
          name: "currency",
          origin: { code: "default", level: "store_view" },
          value: "JPY",
        },
      ]),
    );

    const website = await getConfiguration(byWebsiteId(1));
    const storeView = await getConfiguration(byStoreViewId(1));

    expect(website.scope.id).toBe("idw");
    expect(website.scope.level).toBe("website");
    expect(storeView.scope.id).toBe("idsv");
    expect(storeView.scope.level).toBe("store_view");
  });

  test("Commerce ID selector throws when the id is unknown", async () => {
    await expect(getConfiguration(byWebsiteId(999))).rejects.toThrow(
      INVALID_SCOPE_RE,
    );
  });

  test("throws error when setting configuration without schema initialized", async () => {
    // @ts-expect-error Clear the schema to simulate not calling initialize
    setGlobalSchema(null);

    await expect(
      setConfiguration(
        { config: [{ name: "currency", value: "JPY" }] },
        byCodeAndLevel("global", "global"),
      ),
    ).rejects.toThrow();
  });

  test("sets configuration and persists to files/state", async () => {
    const response = await setConfiguration(
      { config: [{ name: "currency", value: "JPY" }] },
      byCodeAndLevel("global", "global"),
    );

    expect(response.message).toBe("Configuration values updated successfully");
    expect(response.scope.code).toBe("global");
    expect(response.config).toEqual([{ name: "currency", value: "JPY" }]);

    // Verify persistence in files
    const persisted = await configRepository.getPersistedConfig("global");
    expect.assert(persisted, "persisted is not defined/truthy");

    const parsed = JSON.parse(persisted);
    expect(
      parsed.config.find((e: ConfigValue) => e.name === "currency")?.value,
    ).toBe("JPY");
  });

  test("merges existing and newly set entries without losing prior values", async () => {
    // Set initial config
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          origin: { code: "global", level: "global" },
          value: "USD",
        },
        {
          name: "exampleList",
          origin: { code: "global", level: "global" },
          value: "option1",
        },
      ]),
    );

    // Update only currency
    await setConfiguration(
      { config: [{ name: "currency", value: "CAD" }] },
      byCodeAndLevel("global", "global"),
    );

    // Verify both values are present
    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(
      result.config.find((e: ConfigValue) => e.name === "currency")?.value,
    ).toBe("CAD");
    expect(
      result.config.find((e: ConfigValue) => e.name === "exampleList")?.value,
    ).toBe("option1");
  });

  test("ignores extra properties in setConfiguration request entries", async () => {
    // Test that extra properties are stripped at runtime
    const response = await setConfiguration(
      {
        config: [
          {
            anotherProp: 123,
            extraProp: "ignored",
            name: "currency",
            value: "GBP",
          } as any, // Allow extra props for runtime testing
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    expect(response.config).toEqual([{ name: "currency", value: "GBP" }]);
  });

  test("skips entries missing value and strips unknown props as per request contract", async () => {
    // Test malformed entries are handled at runtime
    const response = await setConfiguration(
      {
        config: [
          { name: "currency" } as any, // missing value - test runtime handling
          { name: "exampleList", value: "option1" }, // valid
          { value: "orphaned" } as any, // missing name - test runtime handling
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    expect(response.config).toEqual([
      { name: "exampleList", value: "option1" },
    ]);
  });
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
    const [, savedScopeTree] = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0];

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
    // @ts-expect-error Reset global schema before each test
    setGlobalSchema(null);
  });

  test("should set global schema when schema is provided", () => {
    const testSchema = [
      {
        default: "test",
        label: "Test Field",
        name: "testField",
        type: "text",
      },
    ] satisfies BusinessConfigSchema;

    initialize({ schema: testSchema });

    const storedSchema = getGlobalSchema();
    expect(storedSchema).toEqual(testSchema);
  });

  test("should throw error when no schema provided and no global schema exists", () => {
    expect(() => initialize({})).toThrow();
  });

  test("should call setGlobalStateOptions when libStateOptions is provided", () => {
    const testSchema = [
      { default: "", label: "Field", name: "field", type: "text" },
    ] satisfies BusinessConfigSchema;

    initialize({ libStateOptions: { region: "emea" }, schema: testSchema });

    expect(repository.setGlobalStateOptions).toHaveBeenCalledWith({
      region: "emea",
    });
  });

  test("should not call setGlobalStateOptions when libStateOptions is omitted", () => {
    const testSchema = [
      { default: "", label: "Field", name: "field", type: "text" },
    ] satisfies BusinessConfigSchema;

    initialize({ schema: testSchema });

    expect(repository.setGlobalStateOptions).not.toHaveBeenCalled();
  });

  test("should resolve dynamic list options when runtime params are provided", async () => {
    const testSchema = [
      {
        default: (opts) => opts[0].value,
        name: "paymentMethod",
        options: (params: RuntimeActionParams) => [
          { label: String(params.PAYMENT_LABEL), value: "braintree" },
        ],
        selectionMode: "single",
        type: "dynamicList",
      },
    ] satisfies BusinessConfigSchema;

    const result = await initialize({
      params: { PAYMENT_LABEL: "Braintree" },
      schema: testSchema,
    });

    expect(result.configSchema[0]).toMatchObject({
      default: "braintree",
      name: "paymentMethod",
      options: [{ label: "Braintree", value: "braintree" }],
      selectionMode: "single",
      type: "list",
    });
    expect(getGlobalSchema()).toEqual(result.configSchema);
  });

  test("should reject dynamic list options when runtime params are missing", () => {
    const testSchema = [
      {
        default: (opts) => opts[0].value,
        name: "paymentMethod",
        options: () => [{ label: "Braintree", value: "braintree" }],
        selectionMode: "single",
        type: "dynamicList",
      },
    ] satisfies BusinessConfigSchema;

    expect(() => initialize({ schema: testSchema })).toThrow(
      "Dynamic list options require runtime params",
    );
  });

  test("should succeed when no schema provided but global schema already exists", () => {
    const existingSchema = [
      {
        default: "existing",
        label: "Existing Field",
        name: "existingField",
        type: "text",
      },
    ] satisfies BusinessConfigSchema;

    // First initialize with schema
    initialize({ schema: existingSchema });

    // Verify schema was set
    expect(getGlobalSchema()).toEqual(existingSchema);

    // Second initialize without schema should succeed
    expect(() => initialize({})).not.toThrow();

    // Schema should still be the same
    expect(getGlobalSchema()).toEqual(existingSchema);
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
    auth: {
      clientId: "test-client-id",
      clientSecrets: ["test-client-secret"],
      environment: "prod",
      imsOrgId: "test-ims-org-id",
      technicalAccountEmail: "test-technical-account-email",
      technicalAccountId: "test-technical-account-id",
    },
    config: {
      baseUrl: "https://test.commerce.com",
      flavor: "saas",
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
      storeGroups: [],
      storeViews: [],
      websites: [],
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
        children: [
          {
            code: "region_us_west",
            is_editable: true,
            is_final: true,
            label: "US West",
            level: "custom",
          },
        ],
        code: "region_us",
        is_editable: true,
        is_final: false,
        label: "US Region",
        level: "custom",
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
        code: "region_eu",
        id: "existing-custom-id",
        is_editable: true,
        is_final: false,
        is_removable: true,
        label: "Old EU Region",
        level: "custom",
      },
    ];

    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      existingCustomScopes,
    );

    const result = await setCustomScopeTree({
      scopes: [
        {
          code: "region_eu",
          is_editable: true,
          is_final: false,
          label: "European Region",
          level: "custom",
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
          is_editable: true,
          is_final: true,
          label: "New Region",
          level: "custom",
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
          is_editable: true,
          is_final: true,
          label: "Custom Scope",
          level: "custom",
        },
      ],
    });

    const [, savedTree] = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0];

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
          is_editable: true,
          is_final: true,
          label: "Region",
          level: "custom",
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

    const [, savedTree] = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0];
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
            is_editable: true,
            is_final: true,
            label: "Region A",
            level: "custom",
          },
          {
            code: "region",
            is_editable: true,
            is_final: true,
            label: "Region B",
            level: "custom",
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
            code: "region",
            id: "   ",
            is_editable: true,
            is_final: true,
            label: "Region",
            level: "custom",
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
            is_editable: true,
            is_final: true,
            label: "Invalid",
            level: "custom",
          },
        ],
      }),
    ).rejects.toThrow();
  });
});
