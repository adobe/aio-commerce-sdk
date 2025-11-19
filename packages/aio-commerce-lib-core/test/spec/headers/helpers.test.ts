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

import { describe, expect, test } from "vitest";

import { getHeader, getHeadersFromParams } from "#headers";

describe("headers/helpers", () => {
  describe("getHeader", () => {
    test("should get header with exact case match", () => {
      const headers = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
      };

      expect(getHeader(headers, "x-api-key")).toBe("test-key");
      expect(getHeader(headers, "Authorization")).toBe("Bearer token");
    });

    test("should get header with case-insensitive match", () => {
      const headers = { authorization: "Bearer token" };

      expect(getHeader(headers, "Authorization")).toBe("Bearer token");
      expect(getHeader(headers, "AUTHORIZATION")).toBe("Bearer token");
    });

    test("should prioritize exact match over case-insensitive match", () => {
      const headers = {
        authorization: "Bearer lowercase",
        Authorization: "Bearer uppercase",
      };

      // Exact match for "Authorization" returns uppercase value
      expect(getHeader(headers, "Authorization")).toBe("Bearer uppercase");
      // Exact match for "authorization" returns lowercase value
      expect(getHeader(headers, "authorization")).toBe("Bearer lowercase");
    });

    test("should return undefined for missing header", () => {
      const headers = { "x-api-key": "test-key" };

      expect(getHeader(headers, "Authorization")).toBeUndefined();
    });

    test("should return undefined for empty headers object", () => {
      expect(getHeader({}, "x-api-key")).toBeUndefined();
    });

    test("should handle headers with undefined values", () => {
      const headers = { "x-api-key": undefined };

      expect(getHeader(headers, "x-api-key")).toBeUndefined();
    });

    test("should split comma-separated strings into arrays", () => {
      const headers = { "Example-Field": "Foo, Bar" };

      expect(getHeader(headers, "Example-Field")).toEqual(["Foo", "Bar"]);
    });

    test("should trim values when splitting comma-separated strings", () => {
      const headers = { "Example-Field": "Foo , Bar , Baz" };

      expect(getHeader(headers, "Example-Field")).toEqual([
        "Foo",
        "Bar",
        "Baz",
      ]);
    });

    test("should return single strings without commas as-is", () => {
      const headers = { "Example-Field": "SingleValue" };

      expect(getHeader(headers, "Example-Field")).toBe("SingleValue");
    });

    test("should handle empty string", () => {
      const headers = { "Example-Field": "" };

      expect(getHeader(headers, "Example-Field")).toBe("");
    });
  });

  describe("getHeadersFromParams", () => {
    test("should extract __ow_headers from params", () => {
      const params = {
        __ow_headers: {
          "x-api-key": "test-key",
          Authorization: "Bearer token",
        },
        someOtherParam: "value",
      };

      const headers = getHeadersFromParams(params);
      expect(headers).toEqual({
        "x-api-key": "test-key",
        Authorization: "Bearer token",
      });
    });

    test("should throw error when __ow_headers is missing", () => {
      expect(() => {
        getHeadersFromParams({});
      }).toThrow("Missing __ow_headers in action params");
    });

    test("should throw error when __ow_headers is null", () => {
      expect(() => {
        // @ts-expect-error - null is not a valid __ow_headers object
        getHeadersFromParams({ __ow_headers: null });
      }).toThrow("Missing __ow_headers in action params");
    });

    test("should throw error when __ow_headers is undefined", () => {
      expect(() => {
        getHeadersFromParams({ __ow_headers: undefined });
      }).toThrow("Missing __ow_headers in action params");
    });

    test("should throw error when __ow_headers is not an object", () => {
      expect(() => {
        // @ts-expect-error - not-an-object is not a valid __ow_headers object
        getHeadersFromParams({ __ow_headers: "not-an-object" });
      }).toThrow("Missing __ow_headers in action params");

      expect(() => {
        // @ts-expect-error - 123 is not a valid __ow_headers object
        getHeadersFromParams({ __ow_headers: 123 });
      }).toThrow("Missing __ow_headers in action params");

      expect(() => {
        // @ts-expect-error - true is not a valid __ow_headers object
        getHeadersFromParams({ __ow_headers: true });
      }).toThrow("Missing __ow_headers in action params");
    });

    test("should accept empty __ow_headers object", () => {
      const params = { __ow_headers: {} };
      const headers = getHeadersFromParams(params);
      expect(headers).toEqual({});
    });

    test("should preserve header values including empty strings", () => {
      const params = {
        __ow_headers: {
          "x-api-key": "",
          Authorization: "Bearer token",
          "x-custom": undefined,
        },
      };

      const headers = getHeadersFromParams(params);
      expect(headers).toEqual({
        "x-api-key": "",
        Authorization: "Bearer token",
        "x-custom": undefined,
      });
    });

    test("should preserve comma-separated string header values", () => {
      const params = {
        __ow_headers: {
          "Example-Field": "Foo, Bar",
          "x-api-key": "test-key",
        },
      };

      const headers = getHeadersFromParams(params);
      expect(headers).toEqual({
        "Example-Field": "Foo, Bar",
        "x-api-key": "test-key",
      });
    });
  });
});
