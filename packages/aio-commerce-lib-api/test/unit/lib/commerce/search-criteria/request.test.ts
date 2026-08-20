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

import { describe, expect, test, vi } from "vitest";

import { searchCriteria } from "#lib/commerce/search-criteria/builder";
import { buildSearchCriteria } from "#lib/commerce/search-criteria/serialize";
import {
  TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
  TestAdobeCommerceHttpClient,
} from "#test/fixtures/http-clients";

import type { Options } from "ky";

/**
 * Makes a request through a mocked Commerce client and returns the query parameters it was sent with.
 */
async function sentSearchParams(options: Options) {
  const mockFetch = vi.fn(async () =>
    Response.json({ items: [] }, { status: 200 }),
  );

  const client = new TestAdobeCommerceHttpClient(
    TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS_PAAS,
    mockFetch as unknown as typeof fetch,
  );

  let sent: URLSearchParams | undefined;
  await client.get("products", {
    ...options,
    hooks: {
      beforeRequest: [
        (request) => {
          sent = new URL(request.url).searchParams;
        },
      ],
    },
  });

  if (!sent) {
    throw new Error("The request was never made.");
  }

  return sent;
}

const SKU_FIELD = "searchCriteria[filterGroups][0][filters][0][field]";

describe("lib/commerce/search-criteria request integration", () => {
  test("should send serialized search criteria as query parameters", async () => {
    const sent = await sentSearchParams({
      searchParams: searchCriteria()
        .filter({ field: "sku", value: "24-MB01" })
        .paginate({ pageSize: 10 })
        .toSearchParams(),
    });

    expect(sent.get(SKU_FIELD)).toBe("sku");
    expect(sent.get("searchCriteria[pageSize]")).toBe("10");
  });

  // Some endpoints take search criteria alongside unrelated query parameters
  // (`fields` works on any endpoint, for example).
  describe("merging with additional query parameters", () => {
    test("should merge via a spread of the record form", async () => {
      const sent = await sentSearchParams({
        searchParams: {
          ...searchCriteria()
            .filter({ field: "sku", value: "24-MB01" })
            .toRecord(),
          currencyCode: "USD",
          storeId: 1,
        },
      });

      expect(sent.get(SKU_FIELD)).toBe("sku");
      expect(sent.get("storeId")).toBe("1");
      expect(sent.get("currencyCode")).toBe("USD");
    });

    test("should merge by setting additional URLSearchParams entries", async () => {
      const params = buildSearchCriteria({
        filterGroups: [[{ field: "sku", value: "24-MB01" }]],
      });

      params.set("fields", "items[sku,name]");
      const sent = await sentSearchParams({ searchParams: params });

      expect(sent.get(SKU_FIELD)).toBe("sku");
      expect(sent.get("fields")).toBe("items[sku,name]");
    });
  });
});
