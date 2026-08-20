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

import { searchCriteria } from "#lib/commerce/search-criteria/builder";
import { buildSearchCriteria } from "#lib/commerce/search-criteria/serialize";

import type { SearchCriteria } from "#lib/commerce/search-criteria/types";

describe("lib/commerce/search-criteria/builder", () => {
  describe("searchCriteria", () => {
    test("should build empty criteria by default", () => {
      expect(searchCriteria().toJSON()).toStrictEqual({
        filterGroups: undefined,
        sortOrders: undefined,
      });

      expect(searchCriteria().toSearchParams().toString()).toBe("");
    });

    test("should add each filter as its own AND-ed group", () => {
      const result = searchCriteria()
        .filter({ field: "sku", value: "24-MB01" })
        .filter({ conditionType: "gteq", field: "price", value: 10 })
        .toJSON();

      expect(result.filterGroups).toStrictEqual([
        [{ field: "sku", value: "24-MB01" }],
        [{ conditionType: "gteq", field: "price", value: 10 }],
      ]);
    });

    test("should add a filter group as a single OR-ed group", () => {
      const result = searchCriteria()
        .filterGroup(
          { field: "status", value: 1 },
          { field: "status", value: 2 },
        )
        .toJSON();

      expect(result.filterGroups).toStrictEqual([
        [
          { field: "status", value: 1 },
          { field: "status", value: 2 },
        ],
      ]);
    });

    test("should append sort orders, defaulting the direction to ASC", () => {
      const result = searchCriteria()
        .sort("sku")
        .sort("created_at", "DESC")
        .toJSON();

      expect(result.sortOrders).toStrictEqual([
        { direction: "ASC", field: "sku" },
        { direction: "DESC", field: "created_at" },
      ]);
    });

    test("should replace pagination on each call", () => {
      const result = searchCriteria()
        .paginate({ currentPage: 1, pageSize: 10 })
        .paginate({ currentPage: 2, pageSize: 50 })
        .toJSON();

      expect(result).toMatchObject({ currentPage: 2, pageSize: 50 });
    });

    test("should accept initial criteria", () => {
      const result = searchCriteria({ pageSize: 25 })
        .filter({ field: "sku", value: "24-MB01" })
        .toJSON();

      expect(result).toMatchObject({
        filterGroups: [[{ field: "sku", value: "24-MB01" }]],
        pageSize: 25,
      });
    });

    test("should produce the same output as the declarative form", () => {
      const fluent = searchCriteria()
        .filterGroup(
          { field: "status", value: 1 },
          { field: "status", value: 2 },
        )
        .filter({
          conditionType: "gteq",
          field: "created_at",
          value: "2026-01-01",
        })
        .sort("created_at", "DESC")
        .paginate({ currentPage: 1, pageSize: 50 })
        .toSearchParams();

      const declarative = buildSearchCriteria({
        currentPage: 1,
        filterGroups: [
          [
            { field: "status", value: 1 },
            { field: "status", value: 2 },
          ],
          [{ conditionType: "gteq", field: "created_at", value: "2026-01-01" }],
        ],
        pageSize: 50,
        sortOrders: [{ direction: "DESC", field: "created_at" }],
      });

      expect(fluent.toString()).toBe(declarative.toString());
    });

    test("should serialize to a record", () => {
      const result = searchCriteria()
        .filter({ field: "sku", value: "x" })
        .toRecord();

      expect(result).toStrictEqual({
        "searchCriteria[filterGroups][0][filters][0][conditionType]": "eq",
        "searchCriteria[filterGroups][0][filters][0][field]": "sku",
        "searchCriteria[filterGroups][0][filters][0][value]": "x",
      });
    });

    describe("immutability", () => {
      test("should not affect the base builder when specializing it", () => {
        const base = searchCriteria().filter({
          field: "sku",
          value: "24-MB01",
        });

        const page1 = base.paginate({ currentPage: 1, pageSize: 50 });
        const page2 = base.paginate({ currentPage: 2, pageSize: 50 });

        expect(base.toJSON().currentPage).toBeUndefined();
        expect(page1.toJSON()).toMatchObject({ currentPage: 1 });
        expect(page2.toJSON()).toMatchObject({ currentPage: 2 });
      });

      test("should not share filter groups between derived builders", () => {
        const base = searchCriteria().filter({
          field: "sku",
          value: "24-MB01",
        });

        base.filter({ field: "price", value: 10 });
        base.filterGroup({ field: "status", value: 1 });

        expect(base.toJSON().filterGroups).toHaveLength(1);
      });

      test("should not be mutable through the initial criteria", () => {
        const initial: Required<Pick<SearchCriteria, "filterGroups">> = {
          filterGroups: [[{ field: "sku", value: "24-MB01" }]],
        };

        const builder = searchCriteria(initial);
        initial.filterGroups[0].push({ field: "price", value: 10 });

        expect(builder.toJSON().filterGroups).toStrictEqual([
          [{ field: "sku", value: "24-MB01" }],
        ]);
      });

      test("should not be mutable through the result of toJSON", () => {
        const builder = searchCriteria().filter({
          field: "sku",
          value: "24-MB01",
        });

        const snapshot = builder.toJSON();
        snapshot.filterGroups?.push([{ field: "price", value: 10 }]);
        snapshot.filterGroups?.[0].push({ field: "status", value: 1 });

        expect(builder.toJSON().filterGroups).toStrictEqual([
          [{ field: "sku", value: "24-MB01" }],
        ]);
      });
    });
  });
});
