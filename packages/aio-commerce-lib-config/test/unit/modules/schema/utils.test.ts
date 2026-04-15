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

import { validateBusinessConfigSchema } from "#modules/schema/utils";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
  VALID_CONFIGURATION_WITHOUT_DEFAULTS,
} from "#test/fixtures/configuration-schema";

describe("schema/utils", () => {
  describe("validateBusinessConfigSchema", () => {
    test("should not throw with valid schema", () => {
      expect(() => {
        const result = validateBusinessConfigSchema(VALID_CONFIGURATION);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    test("should throw with invalid schema", () => {
      expect(() =>
        validateBusinessConfigSchema(INVALID_CONFIGURATION),
      ).toThrow();
    });

    test("should generate default values for properties that don't have it", () => {
      expect(() => {
        const result = validateBusinessConfigSchema(
          VALID_CONFIGURATION_WITHOUT_DEFAULTS,
        );

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result.map((field) => field.default)).toHaveLength(
          VALID_CONFIGURATION_WITHOUT_DEFAULTS.length,
        );
      }).not.toThrow();
    });

    test("should accept a boolean field with default true", () => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "enableFeature", type: "boolean", default: true },
        ]),
      ).not.toThrow();
    });

    test("should accept a boolean field with default false", () => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "disabledByDefault", type: "boolean", default: false },
        ]),
      ).not.toThrow();
    });

    test("should accept a boolean field without a default", () => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "optionalToggle", type: "boolean" },
        ]),
      ).not.toThrow();
    });

    test("should reject a boolean field with a non-boolean default", () => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "badField", type: "boolean", default: "true" as never },
        ]),
      ).toThrow();
    });
  });
});
