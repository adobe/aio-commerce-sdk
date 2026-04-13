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

import { getConfiguration, setConfiguration } from "#config-manager";
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
  getSharedState: vi.fn(async () => mockStateInstance),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
}));

vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  getPersistedScopeTree: vi.fn(),
  saveScopeTree: vi.fn(),
  getCachedScopeTree: vi.fn(),
  setCachedScopeTree: vi.fn(),
  deleteCachedScopeTree: vi.fn(),
}));

vi.mock("#api/commerce", () => ({
  getAllScopeData: vi.fn(() =>
    Promise.resolve({ websites: [], storeGroups: [], storeViews: [] }),
  ),
}));

const schema = [
  { name: "currency", type: "text", label: "Currency", default: "" },
  { name: "locale", type: "text", label: "Locale", default: "" },
  { name: "apiKey", type: "password", label: "API Key", default: "" },
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
