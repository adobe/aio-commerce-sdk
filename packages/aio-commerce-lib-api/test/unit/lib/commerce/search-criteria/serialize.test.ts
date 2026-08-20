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
  buildSearchCriteria,
  buildSearchCriteriaRecord,
} from "#lib/commerce/search-criteria/serialize";

import type { SearchCriteria } from "#lib/commerce/search-criteria/types";

/** Serializes to a decoded string, so assertions read as the bracketed form. */
function serialize(criteria: SearchCriteria) {
  return decodeURIComponent(buildSearchCriteria(criteria).toString());
}

describe("lib/commerce/search-criteria/serialize", () => {
  describe("buildSearchCriteria", () => {
    test("should return no parameters for empty criteria", () => {
      expect(buildSearchCriteria({}).toString()).toBe("");
    });

    test("should serialize a single filter with the default condition type", () => {
      const result = serialize({
        filterGroups: [[{ field: "sku", value: "24-MB01" }]],
      });

      expect(result).toBe(
        "searchCriteria[filterGroups][0][filters][0][field]=sku&" +
          "searchCriteria[filterGroups][0][filters][0][value]=24-MB01&" +
          "searchCriteria[filterGroups][0][filters][0][conditionType]=eq",
      );
    });

    test("should OR filters within a group and AND across groups", () => {
      const result = serialize({
        filterGroups: [
          [
            { field: "status", value: 1 },
            { field: "status", value: 2 },
          ],
          [{ conditionType: "gteq", field: "created_at", value: "2026-01-01" }],
        ],
      });

      expect(result).toBe(
        "searchCriteria[filterGroups][0][filters][0][field]=status&" +
          "searchCriteria[filterGroups][0][filters][0][value]=1&" +
          "searchCriteria[filterGroups][0][filters][0][conditionType]=eq&" +
          "searchCriteria[filterGroups][0][filters][1][field]=status&" +
          "searchCriteria[filterGroups][0][filters][1][value]=2&" +
          "searchCriteria[filterGroups][0][filters][1][conditionType]=eq&" +
          "searchCriteria[filterGroups][1][filters][0][field]=created_at&" +
          "searchCriteria[filterGroups][1][filters][0][value]=2026-01-01&" +
          "searchCriteria[filterGroups][1][filters][0][conditionType]=gteq",
      );
    });

    test("should comma-join array values", () => {
      const result = serialize({
        filterGroups: [
          [{ conditionType: "in", field: "entity_id", value: [1, 2, 3] }],
        ],
      });

      expect(result).toContain(
        "searchCriteria[filterGroups][0][filters][0][value]=1,2,3",
      );
    });

    test("should accept a scalar value for the in condition", () => {
      const result = serialize({
        filterGroups: [[{ conditionType: "in", field: "entity_id", value: 7 }]],
      });

      expect(result).toContain(
        "searchCriteria[filterGroups][0][filters][0][value]=7",
      );
    });

    // The SQL for a nullness condition ignores the value, but Commerce only
    // switches a non-static EAV attribute join to LEFT when one is present, so
    // it must be forwarded rather than dropped.
    test.each([
      "null",
      "notnull",
    ] as const)("should forward a value supplied with the %s condition", (conditionType) => {
      const result = serialize({
        filterGroups: [
          [{ conditionType, field: "custom_attribute", value: 1 }],
        ],
      });

      expect(result).toBe(
        "searchCriteria[filterGroups][0][filters][0][field]=custom_attribute&" +
          "searchCriteria[filterGroups][0][filters][0][value]=1&" +
          `searchCriteria[filterGroups][0][filters][0][conditionType]=${conditionType}`,
      );
    });

    test.each([
      "null",
      "notnull",
    ] as const)("should emit no value for the %s condition when none is supplied", (conditionType) => {
      const result = serialize({
        filterGroups: [[{ conditionType, field: "custom_attribute" }]],
      });

      expect(result).not.toContain("[value]");
    });

    // Commerce rewrites `seq`/`sneq` to a null check when the value is empty,
    // so an empty string has to survive serialization rather than be dropped.
    test("should preserve an empty string value", () => {
      const result = serialize({
        filterGroups: [
          [{ conditionType: "seq", field: "description", value: "" }],
        ],
      });

      expect(result).toBe(
        "searchCriteria[filterGroups][0][filters][0][field]=description&" +
          "searchCriteria[filterGroups][0][filters][0][value]=&" +
          "searchCriteria[filterGroups][0][filters][0][conditionType]=seq",
      );
    });

    test("should omit the value when none is supplied", () => {
      const result = serialize({
        filterGroups: [[{ conditionType: "eq", field: "sku" }]],
      });

      expect(result).not.toContain("[value]");
    });

    test.each([
      [true, "1"],
      [false, "0"],
    ])("should serialize the boolean %s as %s", (value, expected) => {
      const result = serialize({
        filterGroups: [[{ field: "is_active", value }]],
      });

      expect(result).toContain(
        `searchCriteria[filterGroups][0][filters][0][value]=${expected}`,
      );
    });

    test("should skip empty filter groups so indices stay dense", () => {
      const result = serialize({
        filterGroups: [[], [{ field: "sku", value: "24-MB01" }], []],
      });

      expect(result).toBe(
        "searchCriteria[filterGroups][0][filters][0][field]=sku&" +
          "searchCriteria[filterGroups][0][filters][0][value]=24-MB01&" +
          "searchCriteria[filterGroups][0][filters][0][conditionType]=eq",
      );
    });

    test("should serialize sort orders in order", () => {
      const result = serialize({
        sortOrders: [
          { direction: "DESC", field: "created_at" },
          { direction: "ASC", field: "sku" },
        ],
      });

      expect(result).toBe(
        "searchCriteria[sortOrders][0][field]=created_at&" +
          "searchCriteria[sortOrders][0][direction]=DESC&" +
          "searchCriteria[sortOrders][1][field]=sku&" +
          "searchCriteria[sortOrders][1][direction]=ASC",
      );
    });

    test("should serialize pagination", () => {
      const result = serialize({ currentPage: 3, pageSize: 50 });

      expect(result).toBe(
        "searchCriteria[pageSize]=50&searchCriteria[currentPage]=3",
      );
    });

    test("should serialize a page size of zero", () => {
      const result = serialize({ pageSize: 0 });
      expect(result).toBe("searchCriteria[pageSize]=0");
    });

    test("should percent-encode field names and values", () => {
      const params = buildSearchCriteria({
        filterGroups: [
          [{ conditionType: "like", field: "name", value: "%a b&c%" }],
        ],
      });

      expect(
        params.get("searchCriteria[filterGroups][0][filters][0][value]"),
      ).toBe("%a b&c%");
      expect(params.toString()).toContain("%25a+b%26c%25");
    });
  });

  describe("buildSearchCriteriaRecord", () => {
    test("should serialize to a plain record", () => {
      const result = buildSearchCriteriaRecord({
        filterGroups: [[{ field: "sku", value: "24-MB01" }]],
        pageSize: 10,
      });

      expect(result).toStrictEqual({
        "searchCriteria[filterGroups][0][filters][0][conditionType]": "eq",
        "searchCriteria[filterGroups][0][filters][0][field]": "sku",
        "searchCriteria[filterGroups][0][filters][0][value]": "24-MB01",
        "searchCriteria[pageSize]": "10",
      });
    });

    test("should return an empty record for empty criteria", () => {
      expect(buildSearchCriteriaRecord({})).toStrictEqual({});
    });
  });
});
