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

import { createHeaderAccessor } from "~/headers/accessor";

describe("headers/accessor", () => {
  describe("createHeaderAccessor", () => {
    test("should create accessor with camelCase keys", () => {
      const headers = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
      };

      const accessor = createHeaderAccessor(headers, [
        "x-api-key",
        "Authorization",
      ]);

      expect(accessor.xApiKey).toBe("test-key");
      expect(accessor.authorization).toBe("Bearer token");
    });

    test("should handle case-insensitive header lookup", () => {
      const headers = {
        authorization: "Bearer token",
        "X-API-KEY": "test-key",
      };

      const accessor = createHeaderAccessor(headers, [
        "x-api-key",
        "Authorization",
      ]);

      expect(accessor.xApiKey).toBe("test-key");
      expect(accessor.authorization).toBe("Bearer token");
    });

    test("should throw error when header is missing", () => {
      const headers = { "x-api-key": "test-key" };

      expect(() => {
        createHeaderAccessor(headers, ["x-api-key", "Authorization"]);
      }).toThrow("Missing required headers: [Authorization]");
    });

    test("should throw error when multiple headers are missing", () => {
      const headers = {};

      expect(() => {
        createHeaderAccessor(headers, ["x-api-key", "Authorization"]);
      }).toThrow("Missing required headers: [x-api-key, Authorization]");
    });

    test("should throw error when header value is empty", () => {
      const headers = { "x-api-key": "" };

      expect(() => {
        createHeaderAccessor(headers, ["x-api-key"]);
      }).toThrow("Missing required headers: [x-api-key]");
    });

    test("should throw error when header value is whitespace only", () => {
      const headers = { "x-api-key": "   " };

      expect(() => {
        createHeaderAccessor(headers, ["x-api-key"]);
      }).toThrow("Missing required headers: [x-api-key]");
    });

    test("should handle single header", () => {
      const headers = { "x-api-key": "test-key" };

      const accessor = createHeaderAccessor(headers, ["x-api-key"]);

      expect(accessor.xApiKey).toBe("test-key");
    });

    test("should handle multiple headers", () => {
      const headers = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
        "content-type": "application/json",
      };

      const accessor = createHeaderAccessor(headers, [
        "x-api-key",
        "Authorization",
        "content-type",
      ]);

      expect(accessor.xApiKey).toBe("test-key");
      expect(accessor.authorization).toBe("Bearer token");
      expect(accessor.contentType).toBe("application/json");
    });

    test("should handle headers with mixed casing", () => {
      const headers = {
        "X-Api-Key": "test-key",
        AUTHORIZATION: "Bearer token",
      };

      const accessor = createHeaderAccessor(headers, [
        "x-api-key",
        "Authorization",
      ]);

      expect(accessor.xApiKey).toBe("test-key");
      expect(accessor.authorization).toBe("Bearer token");
    });

    test("should normalize complex header names to camelCase", () => {
      const headers = {
        "x-custom-header-name": "value1",
        "another-long-header": "value2",
      };

      const accessor = createHeaderAccessor(headers, [
        "x-custom-header-name",
        "another-long-header",
      ]);

      expect(accessor.xCustomHeaderName).toBe("value1");
      expect(accessor.anotherLongHeader).toBe("value2");
    });

    test("should provide type-safe destructuring", () => {
      const headers = {
        "x-api-key": "test-key",
        Authorization: "Bearer token",
      };

      const { xApiKey, authorization } = createHeaderAccessor(headers, [
        "x-api-key",
        "Authorization",
      ]);

      // TypeScript should know these are strings
      const key: string = xApiKey;
      const auth: string = authorization;

      expect(key).toBe("test-key");
      expect(auth).toBe("Bearer token");
    });
  });
});
