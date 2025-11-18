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

import { parseBearerToken } from "~/headers/auth";

describe("headers/auth", () => {
  describe("parseBearerToken", () => {
    test("should extract Bearer token", () => {
      const token = parseBearerToken("Bearer test-token-123");
      expect(token).toBe("test-token-123");
    });

    test("should trim whitespace from extracted token", () => {
      const token = parseBearerToken("Bearer   test-token-with-spaces   ");
      expect(token).toBe("test-token-with-spaces");
    });

    test("should handle complex JWT tokens", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const token = parseBearerToken(`Bearer ${jwt}`);
      expect(token).toBe(jwt);
    });

    test("should handle tokens with special characters", () => {
      const specialToken = "abc-123_XYZ.def+ghi/jkl=";
      const token = parseBearerToken(`Bearer ${specialToken}`);
      expect(token).toBe(specialToken);
    });

    test("should throw error for non-Bearer authorization", () => {
      expect(() => {
        parseBearerToken("Basic dXNlcjpwYXNz");
      }).toThrow("Authorization header must be a Bearer token");
    });

    test("should throw error for malformed Bearer without space", () => {
      expect(() => {
        parseBearerToken("Bearer");
      }).toThrow("Authorization header must be a Bearer token");
    });

    test("should throw error for Bearer token with only whitespace", () => {
      expect(() => {
        parseBearerToken("Bearer    ");
      }).toThrow("Bearer token cannot be empty");
    });

    test("should throw error for empty Bearer token after trimming", () => {
      expect(() => {
        parseBearerToken("Bearer \t\n  ");
      }).toThrow("Bearer token cannot be empty");
    });

    test("should throw error for case-sensitive Bearer prefix", () => {
      expect(() => {
        parseBearerToken("bearer token123");
      }).toThrow("Authorization header must be a Bearer token");

      expect(() => {
        parseBearerToken("BEARER token123");
      }).toThrow("Authorization header must be a Bearer token");
    });

    test("should handle Bearer token without space", () => {
      // This should throw because "Bearer" prefix includes the space
      expect(() => {
        parseBearerToken("Bearertoken123");
      }).toThrow("Authorization header must be a Bearer token");
    });
  });
});
