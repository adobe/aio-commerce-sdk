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

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getConfiguration,
  getConfigurationVersions,
  restoreConfigurationVersion,
  setConfiguration,
  unsyncCommerceScopes,
} from "#config-manager";
import { byCode, byCodeAndLevel, byScopeId } from "#config-utils";
import * as configRepository from "#modules/configuration/configuration-repository";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

import type { ConfigValue } from "#index";
import type { ScopeTree } from "#modules/scope-tree/types";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

// Module-level variables that will be reassigned in beforeEach
let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

// Mock the shared repository utilities
vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn(async () => mockStateInstance),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
}));

vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  getCachedScopeTree: vi.fn(() => Promise.resolve(null)),
  getPersistedScopeTree: vi.fn(() => Promise.resolve(mockScopeTree)),
  setCachedScopeTree: vi.fn(() => Promise.resolve()),
  saveScopeTree: vi.fn(() => Promise.resolve()),
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
    saveSchema: vi.fn(() => Promise.resolve()),
    getSchemaVersion: vi.fn(() => Promise.resolve(null)),
    setSchemaVersion: vi.fn(() => Promise.resolve()),
  };
});

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
    scope: { id, code, level },
    config: entries,
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
  });

  it("returns defaults when no persisted config", async () => {
    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(result.scope.code).toBe("global");
    expect(Array.isArray(result.config)).toBe(true);
    expect(result.config.length).toBeGreaterThan(0);
  });

  it("reads from state when present", async () => {
    await configRepository.setCachedConfig(
      "global",
      buildPayload("id1", "global", "global", [
        {
          name: "currency",
          value: "€",
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("€");
  });

  it("falls back to files and caches to state", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id2", "global", "global", [
        {
          name: "currency",
          value: "£",
          origin: { code: "global", level: "global" },
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

  it("merges inherited values from parent scopes", async () => {
    // Set up global scope config (top-level parent)
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "$",
          origin: { code: "global", level: "global" },
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
          value: "option1",
          origin: { code: "default", level: "store_view" },
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

  it("resolves scope by code+level to id and fetches same via id", async () => {
    // Use the correct ID from mock scope tree: 'base'/'website' has id 'idw'
    await configRepository.saveConfig(
      "base",
      buildPayload("idw", "base", "website", [
        {
          name: "currency",
          value: "EUR",
          origin: { code: "base", level: "website" },
        },
      ]),
    );

    const resultByCodeLevel = await getConfiguration(
      byCodeAndLevel("base", "website"),
    );
    const resultById = await getConfiguration(byScopeId("idw"));

    expect(resultByCodeLevel).toEqual(resultById);
    expect(resultByCodeLevel.scope.id).toBe("idw");
    expect(resultByCodeLevel.scope.code).toBe("base");
    expect(resultByCodeLevel.scope.level).toBe("website");
  });

  it("sets configuration and persists to files/state", async () => {
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

  it("creates a version record by default when setting configuration", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byCodeAndLevel("global", "global"),
    );

    const result = await getConfigurationVersions(
      byCodeAndLevel("global", "global"),
    );

    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].change.added).toEqual(["currency"]);
    expect(result.versions[0].change.updated).toEqual([]);
    expect(result.versions[0].change.removed).toEqual([]);
    expect(result.versions[0].config).toEqual([
      { name: "currency", value: "USD" },
    ]);
    expect(result.versions[0].changes).toEqual([
      { name: "currency", after: "USD" },
    ]);
  });

  it("includes before/after in changes when a key is updated", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byCodeAndLevel("global", "global"),
    );
    await setConfiguration(
      { config: [{ name: "currency", value: "EUR" }] },
      byCodeAndLevel("global", "global"),
    );

    const result = await getConfigurationVersions(
      byCodeAndLevel("global", "global"),
    );

    expect(result.versions).toHaveLength(2);
    const latest = result.versions[0];
    expect(latest.change.updated).toEqual(["currency"]);
    expect(latest.changes).toEqual([
      { name: "currency", before: "USD", after: "EUR" },
    ]);
  });

  it("normalizes non-string persisted values to strings before versioning", async () => {
    await configRepository.persistConfig(
      "global",
      {
        scope: { id: "id-global", code: "global", level: "global" },
        config: [{ name: "retryCount", value: 3 }],
      },
      { reason: "set" },
    );

    const config = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(
      config.config.find((entry) => entry.name === "retryCount")?.value,
    ).toBe("3");

    const versions = await getConfigurationVersions(
      byCodeAndLevel("global", "global"),
    );
    expect(versions.versions[0].config).toEqual([
      { name: "retryCount", value: "3" },
    ]);
  });

  it("supports listing versions by code selector without explicit level", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byCodeAndLevel("global", "global"),
    );

    const result = await getConfigurationVersions(byCode("global"));

    expect(result.scope.code).toBe("global");
    expect(result.versions).toHaveLength(1);
  });

  it("fails when code selector is ambiguous across multiple levels", async () => {
    const ambiguousScopeTree: ScopeTree = [
      {
        id: "id-global",
        code: "global",
        label: "Global",
        level: "global",
        is_editable: false,
        is_final: false,
        is_removable: false,
        children: [
          {
            id: "id-dup-store",
            code: "dup",
            label: "Duplicate Store",
            level: "store",
            is_editable: true,
            is_final: true,
            is_removable: true,
          },
        ],
      },
      {
        id: "id-dup-website",
        code: "dup",
        label: "Duplicate Website",
        level: "website",
        is_editable: true,
        is_final: true,
        is_removable: true,
      },
    ];
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      ambiguousScopeTree,
    );

    await expect(getConfiguration(byCode("dup"))).rejects.toThrow(
      "AMBIGUOUS_SCOPE_CODE",
    );
  });

  it("persists config even when version write fails", async () => {
    const originalWriteImpl = mockFilesInstance.write.getMockImplementation();
    mockFilesInstance.write.mockImplementation(async (path, content) => {
      if (path.includes("/versions/")) {
        throw new Error("version write failed");
      }

      if (!originalWriteImpl) {
        throw new Error("original write implementation missing");
      }
      return await originalWriteImpl(path, content);
    });

    await expect(
      setConfiguration(
        { config: [{ name: "currency", value: "USD" }] },
        byCodeAndLevel("global", "global"),
      ),
    ).rejects.toThrow("version write failed");

    const persisted = await configRepository.getPersistedConfig("global");
    expect.assert(persisted, "persisted config should remain written");
    const parsed = JSON.parse(persisted);
    expect(
      parsed.config.find((entry: ConfigValue) => entry.name === "currency"),
    ).toBeDefined();
  });

  it("still records versions when version index writes fail", async () => {
    const originalWriteImpl = mockFilesInstance.write.getMockImplementation();
    mockFilesInstance.write.mockImplementation(async (path, content) => {
      if (path.endsWith("/versions/index.json")) {
        throw new Error("index write failed");
      }
      if (!originalWriteImpl) {
        throw new Error("original write implementation missing");
      }
      return await originalWriteImpl(path, content);
    });

    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byCodeAndLevel("global", "global"),
    );
    await setConfiguration(
      { config: [{ name: "currency", value: "EUR" }] },
      byCodeAndLevel("global", "global"),
    );

    const result = await getConfigurationVersions(
      byCodeAndLevel("global", "global"),
    );
    expect(result.versions).toHaveLength(2);
  });

  it("restores changed keys by default and applies removed keys as deletions", async () => {
    await configRepository.persistConfig(
      "global",
      JSON.parse(
        buildPayload("id-global", "global", "global", [
          {
            name: "currency",
            value: "USD",
            origin: { code: "global", level: "global" },
          },
          {
            name: "legacy",
            value: "legacy-value",
            origin: { code: "global", level: "global" },
          },
        ]),
      ),
      { reason: "set" },
    );
    await configRepository.persistConfig(
      "global",
      JSON.parse(
        buildPayload("id-global", "global", "global", [
          {
            name: "currency",
            value: "EUR",
            origin: { code: "global", level: "global" },
          },
          {
            name: "newField",
            value: "new-value",
            origin: { code: "global", level: "global" },
          },
        ]),
      ),
      { reason: "set" },
    );

    const selectedVersionId = (
      await getConfigurationVersions(byCodeAndLevel("global", "global"))
    ).versions[0].id;

    await setConfiguration(
      {
        config: [
          { name: "currency", value: "CAD" },
          { name: "legacy", value: "revived" },
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    const restored = await restoreConfigurationVersion(
      byCodeAndLevel("global", "global"),
      { versionId: selectedVersionId },
    );
    expect(restored.restoredFromVersionId).toBe(selectedVersionId);
    expect(restored.removed).toEqual(["legacy"]);
    expect(restored.config).toHaveLength(2);
    expect(restored.config).toEqual(
      expect.arrayContaining([
        { name: "currency", value: "EUR" },
        { name: "newField", value: "new-value" },
      ]),
    );

    const current = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(
      current.config.find((entry) => entry.name === "currency")?.value,
    ).toBe("EUR");
    expect(
      current.config.find((entry) => entry.name === "newField")?.value,
    ).toBe("new-value");
    expect(current.config.find((entry) => entry.name === "legacy")).toBe(
      undefined,
    );
  });

  it("restores only requested fields when fields[] is provided", async () => {
    await configRepository.persistConfig(
      "global",
      JSON.parse(
        buildPayload("id-global", "global", "global", [
          {
            name: "currency",
            value: "USD",
            origin: { code: "global", level: "global" },
          },
          {
            name: "legacy",
            value: "legacy-value",
            origin: { code: "global", level: "global" },
          },
        ]),
      ),
      { reason: "set" },
    );
    await configRepository.persistConfig(
      "global",
      JSON.parse(
        buildPayload("id-global", "global", "global", [
          {
            name: "currency",
            value: "EUR",
            origin: { code: "global", level: "global" },
          },
        ]),
      ),
      { reason: "set" },
    );

    const selectedVersionId = (
      await getConfigurationVersions(byCodeAndLevel("global", "global"))
    ).versions[0].id;
    await setConfiguration(
      {
        config: [
          { name: "currency", value: "CAD" },
          { name: "legacy", value: "revived" },
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    const restored = await restoreConfigurationVersion(
      byCodeAndLevel("global", "global"),
      { versionId: selectedVersionId, fields: ["currency"] },
    );
    expect(restored.removed).toEqual([]);
    expect(restored.config).toEqual([{ name: "currency", value: "EUR" }]);

    const current = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(
      current.config.find((entry) => entry.name === "currency")?.value,
    ).toBe("EUR");
    expect(current.config.find((entry) => entry.name === "legacy")?.value).toBe(
      "revived",
    );
  });

  it("reports removed keys only when they existed in current scope", async () => {
    await configRepository.persistConfig(
      "global",
      JSON.parse(
        buildPayload("id-global", "global", "global", [
          {
            name: "currency",
            value: "USD",
            origin: { code: "global", level: "global" },
          },
        ]),
      ),
      { reason: "set" },
    );
    await configRepository.persistConfig(
      "global",
      JSON.parse(
        buildPayload("id-global", "global", "global", [
          {
            name: "currency",
            value: "EUR",
            origin: { code: "global", level: "global" },
          },
          {
            name: "featureFlag",
            value: "on",
            origin: { code: "global", level: "global" },
          },
        ]),
      ),
      { reason: "set" },
    );

    const selectedVersionId = (
      await getConfigurationVersions(byCodeAndLevel("global", "global"))
    ).versions[0].id;

    // Current scope does not contain a key that selected version marked as removed.
    await setConfiguration(
      { config: [{ name: "currency", value: "CAD" }] },
      byCodeAndLevel("global", "global"),
    );

    const restored = await restoreConfigurationVersion(
      byCodeAndLevel("global", "global"),
      { versionId: selectedVersionId },
    );

    expect(restored.removed).toEqual([]);
  });

  it("throws VERSION_NOT_FOUND when restore source version is missing", async () => {
    await expect(
      restoreConfigurationVersion(byCodeAndLevel("global", "global"), {
        versionId: "missing-version",
      }),
    ).rejects.toThrow("VERSION_NOT_FOUND");
  });

  it("throws VERSION_CONFLICT when expectedLatestVersionId does not match", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byCodeAndLevel("global", "global"),
    );
    const selectedVersionId = (
      await getConfigurationVersions(byCodeAndLevel("global", "global"))
    ).versions[0].id;

    await expect(
      restoreConfigurationVersion(byCodeAndLevel("global", "global"), {
        versionId: selectedVersionId,
        expectedLatestVersionId: "some-other-latest-id",
      }),
    ).rejects.toThrow("VERSION_CONFLICT");
  });

  it("fails restore when selected version snapshot has invalid shape", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byCodeAndLevel("global", "global"),
    );
    const history = await getConfigurationVersions(
      byCodeAndLevel("global", "global"),
    );
    const [version] = history.versions;
    expect.assert(version, "version should exist");

    const malformedRecord = {
      id: version.id,
      timestamp: version.timestamp,
      scope: version.scope,
      reason: version.reason,
      change: version.change,
      snapshot: { invalid: true },
    };
    await mockFilesInstance.write(
      `scope/global/versions/${version.id}.json`,
      JSON.stringify(malformedRecord),
    );

    await expect(
      restoreConfigurationVersion(byCodeAndLevel("global", "global"), {
        versionId: version.id,
      }),
    ).rejects.toThrow("VERSION_SNAPSHOT_INVALID");
  });

  it("merges existing and newly set entries without losing prior values", async () => {
    // Set initial config
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "USD",
          origin: { code: "global", level: "global" },
        },
        {
          name: "exampleList",
          value: "option1",
          origin: { code: "global", level: "global" },
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

  it("ignores extra properties in setConfiguration request entries", async () => {
    // Test that extra properties are stripped at runtime
    const response = await setConfiguration(
      {
        config: [
          {
            name: "currency",
            value: "GBP",
            extraProp: "ignored",
            anotherProp: 123,
          } as any, // Allow extra props for runtime testing
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    expect(response.config).toEqual([{ name: "currency", value: "GBP" }]);
  });

  it("accepts only string config values at request boundaries", async () => {
    // Test malformed/non-string entries are rejected at runtime
    const response = await setConfiguration(
      {
        config: [
          { name: "currency" } as any, // missing value - test runtime handling
          { name: "exampleList", value: "option1" }, // valid
          { name: "featureFlag", value: true } as any, // boolean should be rejected
          { name: "retryCount", value: 3 } as any, // number should be rejected
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

  it("returns Ok when commerce scope exists and is removed", async () => {
    const scopeTreeWithCommerce: ScopeTree = [...mockScopeTree];
    vi.mocked(scopeTreeRepository.getPersistedScopeTree).mockResolvedValue(
      scopeTreeWithCommerce,
    );

    const { unsynced } = await unsyncCommerceScopes();
    expect(unsynced).toBe(true);

    expect(scopeTreeRepository.saveScopeTree).toHaveBeenCalledTimes(1);
    const savedScopeTree = vi.mocked(scopeTreeRepository.saveScopeTree).mock
      .calls[0][1];

    expect(savedScopeTree).toEqual([mockScopeTree[0]]);
    expect(savedScopeTree.find((scope) => scope.code === "commerce")).toBe(
      undefined,
    );
  });

  it("returns NotFound when commerce scope does not exist", async () => {
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

  it("when error is thrown", async () => {
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
