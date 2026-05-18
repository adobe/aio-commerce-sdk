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

import { describe, expect, test } from "vitest";

import {
  areValidArgs,
  byStoreId,
  byStoreViewId,
  byWebsiteId,
  deriveScopeFromArgs,
  deriveScopeFromCommerceId,
  mergeScopes,
  sanitizeRequestEntries,
} from "#config-utils";
import { mockGlobalConfigValues } from "#test/fixtures/config-values";
import { mockScopeTree } from "#test/fixtures/scope-tree";

import type { ConfigValueWithOptionalOrigin } from "#modules/configuration/types";

const INVALID_SCOPE_RE = /INVALID_SCOPE/;
const INVALID_ARGS_RE = /INVALID_ARGS/;

describe("config-utils", () => {
  describe("sanitizeRequestEntries", () => {
    test("passes valid string entries through", () => {
      const entries: ConfigValueWithOptionalOrigin[] = [
        {
          name: "currency",
          value: "USD",
          origin: { code: "global", level: "global" },
        },
        { name: "locale", value: "en_US" },
      ];

      const result = sanitizeRequestEntries(entries);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: "currency", value: "USD" });
      expect(result[1]).toMatchObject({ name: "locale", value: "en_US" });
    });

    test("passes string array values through", () => {
      const entries: ConfigValueWithOptionalOrigin[] = [
        { name: "listField", value: ["opt1", "opt2"] },
      ];

      const result = sanitizeRequestEntries(entries);

      expect(result).toHaveLength(1);
      expect(result[0].value).toEqual(["opt1", "opt2"]);
    });

    test("passes null values through as unset sentinels", () => {
      const entries = [
        { name: "currency", value: null },
      ] as unknown as ConfigValueWithOptionalOrigin[];

      const result = sanitizeRequestEntries(entries);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: "currency", value: null });
    });

    test("allows a mix of string values and null values", () => {
      const entries = [
        { name: "currency", value: "EUR" },
        { name: "locale", value: null },
        { name: "timezone", value: "UTC" },
      ] as unknown as ConfigValueWithOptionalOrigin[];

      const result = sanitizeRequestEntries(entries);

      expect(result).toHaveLength(3);
      expect(result.find((e) => e.name === "locale")?.value).toBeNull();
    });

    test("filters out entries with number values", () => {
      const entries = [
        { name: "count", value: 42 },
      ] as unknown as ConfigValueWithOptionalOrigin[];

      expect(sanitizeRequestEntries(entries)).toHaveLength(0);
    });

    test("should accept boolean values", () => {
      const entries = [
        { name: "flag", value: true },
        { name: "flag", value: false },
      ] as unknown as ConfigValueWithOptionalOrigin[];

      expect(sanitizeRequestEntries(entries)).toHaveLength(2);
    });

    test("filters out entries with undefined values", () => {
      const entries = [
        { name: "field", value: undefined },
      ] as unknown as ConfigValueWithOptionalOrigin[];

      expect(sanitizeRequestEntries(entries)).toHaveLength(0);
    });

    test("filters out entries with missing or empty name", () => {
      const entries = [
        { value: "value1" },
        { name: "", value: "value2" },
        { name: "   ", value: "value3" },
      ] as unknown as ConfigValueWithOptionalOrigin[];

      expect(sanitizeRequestEntries(entries)).toHaveLength(0);
    });

    test("filters out null/undefined entries", () => {
      const entries = [
        null,
        undefined,
      ] as unknown as ConfigValueWithOptionalOrigin[];

      expect(sanitizeRequestEntries(entries)).toHaveLength(0);
    });

    test("trims whitespace from entry names", () => {
      const entries: ConfigValueWithOptionalOrigin[] = [
        { name: "  currency  ", value: "USD" },
      ];

      const result = sanitizeRequestEntries(entries);

      expect(result[0].name).toBe("currency");
    });

    test("returns empty array for non-array input", () => {
      expect(sanitizeRequestEntries(null as any)).toHaveLength(0);
      expect(sanitizeRequestEntries(undefined as any)).toHaveLength(0);
    });
  });

  describe("mergeScopes", () => {
    const existing = mockGlobalConfigValues;

    test("adds new entries from requested with current scope as origin", () => {
      const result = mergeScopes(
        existing,
        [{ name: "timezone", value: "UTC" }],
        "base",
        "website",
      );

      expect(result.find((e) => e.name === "timezone")).toMatchObject({
        name: "timezone",
        value: "UTC",
        origin: { code: "base", level: "website" },
      });
    });

    test("overrides existing entries and updates origin to current scope", () => {
      const result = mergeScopes(
        existing,
        [{ name: "currency", value: "EUR" }],
        "base",
        "website",
      );

      expect(result.find((e) => e.name === "currency")).toMatchObject({
        value: "EUR",
        origin: { code: "base", level: "website" },
      });
    });

    test("preserves entries not in the requested list", () => {
      const result = mergeScopes(
        existing,
        [{ name: "currency", value: "EUR" }],
        "base",
        "website",
      );

      expect(result.find((e) => e.name === "locale")).toMatchObject({
        value: "en_US",
        origin: { code: "global", level: "global" },
      });
    });

    test("removes an existing entry when requested value is null (unset)", () => {
      const result = mergeScopes(
        existing,
        [{ name: "currency", value: null }],
        "base",
        "website",
      );

      expect(result.find((e) => e.name === "currency")).toBeUndefined();
    });

    test("keeps all other entries intact when unsetting one field", () => {
      const result = mergeScopes(
        existing,
        [{ name: "currency", value: null }],
        "base",
        "website",
      );

      expect(result.find((e) => e.name === "locale")).toBeDefined();
      expect(result).toHaveLength(existing.length - 1);
    });

    test("unsetting a field that does not exist in persisted config is a no-op", () => {
      const result = mergeScopes(
        existing,
        [{ name: "nonExistent", value: null }],
        "base",
        "website",
      );

      expect(result).toHaveLength(existing.length);
    });

    test("handles a mix of set, override, and unset operations in one call", () => {
      const result = mergeScopes(
        existing,
        [
          { name: "currency", value: "GBP" }, // override
          { name: "locale", value: null }, // unset
          { name: "newField", value: "newVal" }, // add
        ],
        "base",
        "website",
      );

      expect(result.find((e) => e.name === "currency")?.value).toBe("GBP");
      expect(result.find((e) => e.name === "locale")).toBeUndefined();
      expect(result.find((e) => e.name === "newField")?.value).toBe("newVal");
    });

    test("returns empty array when both inputs are empty", () => {
      expect(mergeScopes([], [], "base", "website")).toEqual([]);
    });

    test("returns requested entries when existing is empty", () => {
      const result = mergeScopes(
        [],
        [{ name: "field", value: "value" }],
        "base",
        "website",
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: "field", value: "value" });
    });

    test("unsetting from empty existing is a no-op", () => {
      const result = mergeScopes(
        [],
        [{ name: "field", value: null }],
        "base",
        "website",
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("Commerce ID selectors", () => {
    test("byWebsiteId hard-codes level=website", () => {
      expect(byWebsiteId(1)).toEqual({
        by: { _tag: "commerceId", commerceId: 1, level: "website" },
      });
    });

    test("byStoreId hard-codes level=store", () => {
      expect(byStoreId(1)).toEqual({
        by: { _tag: "commerceId", commerceId: 1, level: "store" },
      });
    });

    test("byStoreViewId hard-codes level=store_view", () => {
      expect(byStoreViewId(1)).toEqual({
        by: { _tag: "commerceId", commerceId: 1, level: "store_view" },
      });
    });
  });

  describe("deriveScopeFromCommerceId", () => {
    test("resolves a website scope by commerce_id and level", () => {
      const result = deriveScopeFromCommerceId(1, "website", mockScopeTree);

      expect(result.scopeId).toBe("idw");
      expect(result.scopeCode).toBe("base");
      expect(result.scopeLevel).toBe("website");
      // findScopePath returns the path bottom-up (leaf first, root last)
      expect(result.scopePath.map((node) => node.id)).toEqual([
        "idw",
        "id-commerce",
      ]);
    });

    test("disambiguates by level when commerce_id is reused across levels", () => {
      // mockScopeTree has commerce_id=1 on website, store, and store_view
      const store = deriveScopeFromCommerceId(1, "store", mockScopeTree);
      const storeView = deriveScopeFromCommerceId(
        1,
        "store_view",
        mockScopeTree,
      );

      expect(store.scopeId).toBe("ids");
      expect(store.scopeLevel).toBe("store");
      expect(storeView.scopeId).toBe("idsv");
      expect(storeView.scopeLevel).toBe("store_view");
    });

    test("throws INVALID_SCOPE when commerce_id is unknown", () => {
      expect(() =>
        deriveScopeFromCommerceId(999, "website", mockScopeTree),
      ).toThrow(INVALID_SCOPE_RE);
    });

    test("throws INVALID_SCOPE when level does not match", () => {
      expect(() =>
        deriveScopeFromCommerceId(1, "store_view", [
          // tree without commerce_id=1 at store_view level
          mockScopeTree[0],
        ]),
      ).toThrow(INVALID_SCOPE_RE);
    });

    test("throws INVALID_ARGS for non-number commerceId", () => {
      expect(() =>
        deriveScopeFromCommerceId("1", "website", mockScopeTree),
      ).toThrow(INVALID_ARGS_RE);
    });

    test("throws INVALID_ARGS for missing level", () => {
      expect(() => deriveScopeFromCommerceId(1, "", mockScopeTree)).toThrow(
        INVALID_ARGS_RE,
      );
    });
  });

  describe("deriveScopeFromArgs dispatch", () => {
    test("routes (number, string) to commerce_id resolution", () => {
      const result = deriveScopeFromArgs([1, "website"], mockScopeTree);
      expect(result.scopeId).toBe("idw");
    });

    test("still routes (string, string) to code+level resolution", () => {
      const result = deriveScopeFromArgs(["base", "website"], mockScopeTree);
      expect(result.scopeId).toBe("idw");
    });
  });

  describe("areValidArgs", () => {
    test("accepts (commerceId: number, level: string)", () => {
      expect(areValidArgs([1, "website"])).toBe(true);
    });

    test("rejects (NaN, level)", () => {
      expect(areValidArgs([Number.NaN, "website"])).toBe(false);
    });

    test("rejects (number, empty string)", () => {
      expect(areValidArgs([1, ""])).toBe(false);
    });

    test("still accepts (code: string, level: string)", () => {
      expect(areValidArgs(["base", "website"])).toBe(true);
    });
  });
});
