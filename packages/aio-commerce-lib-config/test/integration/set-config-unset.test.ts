/*
 * Copyright 2026 Adobe. All rights reserved.
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
  getMissingRequiredFor,
  setConfiguration,
} from "#config-manager";
import { byScopeId } from "#config-utils";
import { setGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPersistedScopeTree } from "#modules/scope-tree/scope-tree-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

import type { BusinessConfigSchema } from "#index";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

vi.mock("#utils/repository", () => ({
  getAllSharedStates: vi.fn(async () => [mockStateInstance]),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
  getSharedState: vi.fn(async () => mockStateInstance),
}));

vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  deleteCachedScopeTree: vi.fn(),
  getCachedScopeTree: vi.fn(),
  getPersistedScopeTree: vi.fn(),
  saveScopeTree: vi.fn(),
  setCachedScopeTree: vi.fn(),
}));

vi.mock("#api/commerce", () => ({
  getAllScopeData: vi.fn(() =>
    Promise.resolve({ storeGroups: [], storeViews: [], websites: [] }),
  ),
}));

const schema = [
  { default: "", label: "Currency", name: "currency", type: "text" },
  { default: "", label: "Locale", name: "locale", type: "text" },
  { default: "", label: "API Key", name: "apiKey", type: "password" },
] satisfies BusinessConfigSchema;

// mockScopeTree has: global (id-global), commerce > base (idw) > main_store (ids) > default (idsv)
const GLOBAL_ID = "id-global";
const WEBSITE_ID = "idw";

describe("setConfiguration — null/unset semantics", () => {
  beforeEach(() => {
    mockStateInstance = new MockState();
    mockFilesInstance = new MockFiles();
    setGlobalSchema(schema);
    vi.clearAllMocks();
    vi.mocked(getPersistedScopeTree).mockResolvedValue(mockScopeTree);
  });

  describe("lifecycle configuration requirements", () => {
    beforeEach(() => {
      mockStateInstance = new MockState();
      mockFilesInstance = new MockFiles();
      setGlobalSchema([
        {
          default: "",
          name: "credential",
          requiredFor: ["installation", "upgrade"],
          type: "password",
        },
        {
          default: false,
          name: "enabled",
          requiredFor: ["installation"],
          type: "boolean",
        },
        {
          default: "fallback",
          name: "region",
          requiredFor: ["upgrade"],
          type: "text",
        },
        { default: "", name: "optional", type: "text" },
      ]);
      vi.clearAllMocks();
      vi.mocked(getPersistedScopeTree).mockResolvedValue(mockScopeTree);
    });

    test("checks only fields for the requested operation and accepts defaults", async () => {
      expect(await getMissingRequiredFor("installation")).toEqual([
        "credential",
      ]);
      expect(await getMissingRequiredFor("upgrade")).toEqual(["credential"]);
    });

    test("uses global values, not other scopes, and does not decrypt secrets", async () => {
      await setConfiguration(
        { config: [{ name: "credential", value: "site" }] },
        byScopeId(WEBSITE_ID),
        { encryptionKey: "a".repeat(64) },
      );
      expect(await getMissingRequiredFor("installation")).toEqual([
        "credential",
      ]);
      await setConfiguration(
        { config: [{ name: "credential", value: "global" }] },
        byScopeId(GLOBAL_ID),
        { encryptionKey: "a".repeat(64) },
      );
      expect(await getMissingRequiredFor("installation")).toEqual([]);
      expect(await getMissingRequiredFor("upgrade")).toEqual([]);
    });
  });

  describe("setConfiguration — fields required for save", () => {
    beforeEach(() => {
      mockStateInstance = new MockState();
      mockFilesInstance = new MockFiles();
      setGlobalSchema([
        {
          default: "",
          name: "currency",
          requiredFor: ["save"],
          type: "text",
        },
        { default: "", name: "locale", requiredFor: ["save"], type: "text" },
        {
          default: false,
          name: "enabled",
          requiredFor: ["save"],
          type: "boolean",
        },
        {
          default: [],
          name: "methods",
          options: [{ label: "One", value: "one" }],
          requiredFor: ["save"],
          selectionMode: "multiple",
          type: "list",
        },
        {
          default: "",
          name: "optional",
          requiredFor: ["installation"],
          type: "text",
        },
      ]);
      vi.clearAllMocks();
      vi.mocked(getPersistedScopeTree).mockResolvedValue(mockScopeTree);
    });

    test.each([
      { name: "currency", value: "" },
      { name: "currency", value: null },
      { name: "methods", value: [] },
      { name: "methods", value: null },
    ])("rejects a missing save-required value for $name", async (entry) => {
      await expect(
        setConfiguration({ config: [entry] }, byScopeId(GLOBAL_ID)),
      ).rejects.toThrow(
        `Field "${entry.name}" required for save must have a value`,
      );
    });

    test("rejects a required entry with an omitted value", async () => {
      await expect(
        setConfiguration(
          // @ts-expect-error Check malformed JavaScript callers at runtime.
          { config: [{ name: "currency" }] },
          byScopeId(GLOBAL_ID),
        ),
      ).rejects.toThrow(
        'Field "currency" required for save must have a valid value',
      );
    });

    test("accepts false and leaves omitted save-required fields unvalidated", async () => {
      await expect(
        setConfiguration(
          { config: [{ name: "enabled", value: false }] },
          byScopeId(GLOBAL_ID),
        ),
      ).resolves.toMatchObject({ config: [{ name: "enabled", value: false }] });
    });

    test("allows unsetting a required field when it inherits a value", async () => {
      await setConfiguration(
        { config: [{ name: "currency", value: "USD" }] },
        byScopeId(GLOBAL_ID),
      );
      await setConfiguration(
        { config: [{ name: "currency", value: "EUR" }] },
        byScopeId(WEBSITE_ID),
      );
      await setConfiguration(
        { config: [{ name: "currency", value: null }] },
        byScopeId(WEBSITE_ID),
      );
      const result = await getConfiguration(byScopeId(WEBSITE_ID));
      expect(
        result.config.find((entry) => entry.name === "currency")?.value,
      ).toBe("USD");
    });

    test("rejects an empty override even when the parent has a value", async () => {
      await setConfiguration(
        { config: [{ name: "currency", value: "USD" }] },
        byScopeId(GLOBAL_ID),
      );
      await expect(
        setConfiguration(
          { config: [{ name: "currency", value: "" }] },
          byScopeId(WEBSITE_ID),
        ),
      ).rejects.toThrow('Field "currency" required for save');
    });

    test("allows unsetting a required field when its default is present", async () => {
      await expect(
        setConfiguration(
          { config: [{ name: "enabled", value: null }] },
          byScopeId(GLOBAL_ID),
        ),
      ).resolves.toBeDefined();
    });

    test("rejects unsetting a required override when no inherited value exists", async () => {
      await setConfiguration(
        { config: [{ name: "currency", value: "EUR" }] },
        byScopeId(WEBSITE_ID),
      );
      await expect(
        setConfiguration(
          { config: [{ name: "currency", value: null }] },
          byScopeId(WEBSITE_ID),
        ),
      ).rejects.toThrow('Field "currency" required for save');
      const result = await getConfiguration(byScopeId(WEBSITE_ID));
      expect(
        result.config.find((entry) => entry.name === "currency")?.value,
      ).toBe("EUR");
    });

    test("rejects the entire update before persisting when one field is invalid", async () => {
      await expect(
        setConfiguration(
          {
            config: [
              { name: "optional", value: "saved" },
              { name: "currency", value: "" },
            ],
          },
          byScopeId(GLOBAL_ID),
        ),
      ).rejects.toThrow('Field "currency" required for save');
      const result = await getConfiguration(byScopeId(GLOBAL_ID));
      expect(
        result.config.find((entry) => entry.name === "optional")?.value,
      ).toBe("");
    });

    test("permits empty values for fields not required for save", async () => {
      await expect(
        setConfiguration(
          { config: [{ name: "optional", value: "" }] },
          byScopeId(GLOBAL_ID),
        ),
      ).resolves.toBeDefined();
    });
  });

  test("null value removes the explicit override from a scope", async () => {
    // 1. Set currency on global scope
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byScopeId(GLOBAL_ID),
    );

    // 2. Override currency on website scope
    await setConfiguration(
      { config: [{ name: "currency", value: "EUR" }] },
      byScopeId(WEBSITE_ID),
    );

    const before = await getConfiguration(byScopeId(WEBSITE_ID));
    expect(before.config.find((e) => e.name === "currency")?.value).toBe("EUR");

    // 3. Unset currency on website scope (null = remove override)
    await setConfiguration(
      { config: [{ name: "currency", value: null }] },
      byScopeId(WEBSITE_ID),
    );

    // 4. Website should now inherit from global
    const after = await getConfiguration(byScopeId(WEBSITE_ID));
    const currencyEntry = after.config.find((e) => e.name === "currency");
    expect(currencyEntry?.value).toBe("USD");
    expect(currencyEntry?.origin).toMatchObject({
      code: "global",
      level: "global",
    });
  });

  test("unsetting a field that was never set on the scope is a no-op", async () => {
    // Set currency on global only
    await setConfiguration(
      { config: [{ name: "currency", value: "JPY" }] },
      byScopeId(GLOBAL_ID),
    );

    // Unsetting currency on website (where it was never overridden) should not error
    await expect(
      setConfiguration(
        { config: [{ name: "currency", value: null }] },
        byScopeId(WEBSITE_ID),
      ),
    ).resolves.not.toThrow();

    // Global value still accessible from website via inheritance
    const result = await getConfiguration(byScopeId(WEBSITE_ID));
    expect(result.config.find((e) => e.name === "currency")?.value).toBe("JPY");
  });

  test("null entries are excluded from the setConfiguration response", async () => {
    // First set a value so it exists
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byScopeId(GLOBAL_ID),
    );

    // Unset it
    const result = await setConfiguration(
      { config: [{ name: "currency", value: null }] },
      byScopeId(GLOBAL_ID),
    );

    expect(result.config.find((e) => e.name === "currency")).toBeUndefined();
  });

  test("mix of set, override, and unset in one call", async () => {
    // Seed global scope
    await setConfiguration(
      {
        config: [
          { name: "currency", value: "USD" },
          { name: "locale", value: "en_US" },
        ],
      },
      byScopeId(GLOBAL_ID),
    );

    // On website: override locale, unset currency, add a new field via the existing values
    await setConfiguration(
      {
        config: [
          { name: "locale", value: "fr_FR" }, // override
          { name: "currency", value: null }, // unset (should fall back to global)
        ],
      },
      byScopeId(WEBSITE_ID),
    );

    const result = await getConfiguration(byScopeId(WEBSITE_ID));

    // locale is overridden at website level
    const localeEntry = result.config.find((e) => e.name === "locale");
    expect(localeEntry?.value).toBe("fr_FR");
    expect(localeEntry?.origin).toMatchObject({
      code: "base",
      level: "website",
    });

    // currency is inherited from global
    const currencyEntry = result.config.find((e) => e.name === "currency");
    expect(currencyEntry?.value).toBe("USD");
    expect(currencyEntry?.origin).toMatchObject({
      code: "global",
      level: "global",
    });
  });

  test("null for a password field does not throw an encryption error", async () => {
    // apiKey is a password field — unsetting it should not trigger encryption
    await expect(
      setConfiguration(
        { config: [{ name: "apiKey", value: null }] },
        byScopeId(GLOBAL_ID),
      ),
    ).resolves.not.toThrow();
  });
});
