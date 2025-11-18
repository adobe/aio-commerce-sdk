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

import { assertRequiredHeaders } from "~/headers/validation";

describe("headers/validation", () => {
  describe("assertRequiredHeaders", () => {
    test("should pass when all required headers are present", () => {
      const headers = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
      };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);
      }).not.toThrow();
    });

    test("should pass with single required header", () => {
      const headers = { "x-api-key": "test-key" };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key"]);
      }).not.toThrow();
    });

    test("should pass with empty required headers array", () => {
      const headers = { "x-api-key": "test-key" };

      expect(() => {
        assertRequiredHeaders(headers, []);
      }).not.toThrow();
    });

    test("should throw error when header is missing", () => {
      const headers = { "x-api-key": "test-key" };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);
      }).toThrow("Missing required headers: [Authorization]");
    });

    test("should throw error when multiple headers are missing", () => {
      const headers = {};

      expect(() => {
        assertRequiredHeaders(headers, [
          "x-api-key",
          "Authorization",
          "x-custom",
        ]);
      }).toThrow(
        "Missing required headers: [x-api-key, Authorization, x-custom]",
      );
    });

    test("should throw error when header value is undefined", () => {
      const headers = { "x-api-key": undefined };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key"]);
      }).toThrow("Missing required headers: [x-api-key]");
    });

    test("should throw error when header value is null", () => {
      const headers = { "x-api-key": null as unknown as string };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key"]);
      }).toThrow("Missing required headers: [x-api-key]");
    });

    test("should throw error when header value is empty string", () => {
      const headers = { "x-api-key": "" };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key"]);
      }).toThrow("Missing required headers: [x-api-key]");
    });

    test("should throw error when header value is only whitespace", () => {
      const headers = {
        "x-api-key": "   ",
        Authorization: "\t\n",
      };

      expect(() => {
        assertRequiredHeaders(headers, ["x-api-key"]);
      }).toThrow("Missing required headers: [x-api-key]");

      expect(() => {
        assertRequiredHeaders(headers, ["Authorization"]);
      }).toThrow("Missing required headers: [Authorization]");
    });

    test("should handle case-insensitive header lookup", () => {
      const headers = { authorization: "Bearer token" };

      expect(() => {
        assertRequiredHeaders(headers, ["Authorization"]);
      }).not.toThrow();
    });

    test("should validate mix of present and missing headers", () => {
      const headers = {
        "x-api-key": "test-key",
        "x-custom": "value",
      };

      expect(() => {
        assertRequiredHeaders(headers, [
          "x-api-key",
          "Authorization",
          "x-custom",
        ]);
      }).toThrow("Missing required headers: [Authorization]");
    });

    test("should narrow types after successful assertion", () => {
      const headers: Record<string, string | undefined> = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
      };

      assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);

      // TypeScript should now know these are strings (not string | undefined)
      const apiKey: string = headers["x-api-key"];
      const auth: string = headers.Authorization;

      expect(apiKey).toBe("test-key");
      expect(auth).toBe("Bearer token");
    });

    test("should preserve non-required headers", () => {
      const headers = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
        "x-optional": "optional-value",
      };

      assertRequiredHeaders(headers, ["x-api-key"]);
      expect(headers["x-optional"]).toBe("optional-value");
    });
  });
});
