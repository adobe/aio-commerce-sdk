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
  getConfiguration,
  getScopeTree,
  setConfiguration,
  setCustomScopeTree,
} from "#config-manager";
import { byCode, byCodeAndLevel, byScopeId } from "#config-utils";
import * as configRepository from "#modules/configuration/configuration-repository";
import { setGlobalSchema } from "#modules/schema/config-schema-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

import type { BusinessConfigSchema, ConfigValue } from "#index";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

// Only the external I/O boundary is mocked — aio-lib-state and aio-lib-files
vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn(async () => mockStateInstance),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
}));

// Commerce API is an external system boundary
vi.mock("#api/commerce", () => ({
  getAllScopeData: vi.fn(() =>
    Promise.resolve({ websites: [], storeGroups: [], storeViews: [] }),
  ),
}));

const integrationSchema = [
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
  {
    name: "apiPassword",
    type: "password",
    label: "API Password",
    default: "",
  },
] satisfies BusinessConfigSchema;

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

describe("config-manager", () => {
  beforeEach(async () => {
    mockStateInstance = new MockState();
    mockFilesInstance = new MockFiles();

    // Seed external storage with the scope tree and schema so all internal
    // repositories can read them without being mocked
    await mockFilesInstance.write(
      "aio-commerce-config/scope-tree.json",
      JSON.stringify({
        scopes: mockScopeTree,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      }),
    );
    await mockFilesInstance.write(
      "config-schema.json",
      JSON.stringify(integrationSchema),
    );

    // Initialize global schema for the tests
    setGlobalSchema(integrationSchema);

    // Clear spy call history after seeding so tests start with a clean slate
    vi.clearAllMocks();
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
          value: "€",
          origin: { code: "global", level: "global" },
        },
      ]),
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

  test("merges inherited values from parent scopes", async () => {
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

  test("resolves scope by code+level to id and fetches same via id", async () => {
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

  test("ignores extra properties in setConfiguration request entries", async () => {
    await setConfiguration(
      {
        config: [
          {
            name: "currency",
            value: "GBP",
            extraProp: "ignored",
            anotherProp: 123,
          } as any,
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    const saved = result.config.find((e) => e.name === "currency");

    expect(saved?.value).toBe("GBP");
    expect(saved).not.toHaveProperty("extraProp");
  });

  test("resolves scope by code only using byCode selector", async () => {
    await configRepository.saveConfig(
      "global_region",
      buildPayload("id-global-region", "global_region", "global", [
        {
          name: "currency",
          value: "AUD",
          origin: { code: "global_region", level: "global" },
        },
      ]),
    );

    const result = await getConfiguration(byCode("global_region"));
    expect(result.scope.code).toBe("global_region");
    expect(result.scope.level).toBe("global");
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("AUD");
  });

  test("sets configuration using byCode selector", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "NZD" }] },
      byCode("global_region"),
    );

    const result = await getConfiguration(byCode("global_region"));
    expect(result.scope.code).toBe("global_region");
    expect(result.scope.level).toBe("global");
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("NZD");
  });

  test("sets configuration using byScopeId selector", async () => {
    await setConfiguration(
      { config: [{ name: "currency", value: "SEK" }] },
      byScopeId("id-global"),
    );

    const result = await getConfiguration(byScopeId("id-global"));
    expect(result.scope.id).toBe("id-global");
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("SEK");
  });

  test("resolves to global scope when no selector is provided", async () => {
    const result = await getConfiguration();
    expect(result.scope.code).toBe("global");
    expect(result.scope.level).toBe("global");
  });

  test("sets configuration using default global selector when no selector is provided", async () => {
    await setConfiguration({ config: [{ name: "currency", value: "EUR" }] });

    const result = await getConfiguration();
    expect(result.scope.code).toBe("global");
    expect(result.scope.level).toBe("global");
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("EUR");
  });

  test("schema defaults have system level as origin", async () => {
    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    const schemaDefault = result.config.find((e) => e.name === "currency");
    expect(schemaDefault?.origin.level).toBe("system");
  });

  test("throws when setting a password field without an encryption key", async () => {
    await expect(
      setConfiguration(
        { config: [{ name: "apiPassword", value: "secret" }] },
        byCodeAndLevel("global", "global"),
      ),
    ).rejects.toThrow("Encryption key has not been given");
  });

  test("skips entries missing value and strips unknown props as per request contract", async () => {
    await setConfiguration(
      {
        config: [
          { name: "exampleList", value: "option1" },

          // @ts-expect-error testing resilience to missing value prop
          { name: "currency" },

          // @ts-expect-error testing resilience to missing name prop
          { value: "orphaned" },
        ],
      },
      byCodeAndLevel("global", "global"),
    );

    const result = await getConfiguration(byCodeAndLevel("global", "global"));
    expect(result.config.find((e) => e.name === "exampleList")?.value).toBe(
      "option1",
    );

    expect(result.config.find((e) => e.name === "currency")?.value).toBe("");
  });
});

describe("setCustomScopeTree", () => {
  test("persists caller-provided id without replacing it with a generated one", async () => {
    await setCustomScopeTree({
      scopes: [
        {
          id: "my-explicit-id",
          code: "region_apac",
          label: "APAC Region",
          level: "custom",
          is_editable: true,
          is_final: true,
        },
      ],
    });

    const { scopeTree } = await getScopeTree();
    const saved = scopeTree.find((s) => s.code === "region_apac");
    expect(saved?.id).toBe("my-explicit-id");
  });
});
