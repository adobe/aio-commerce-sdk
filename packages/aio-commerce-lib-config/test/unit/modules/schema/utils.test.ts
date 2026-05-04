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

import {
  filterBusinessConfigSchemaByFlavor,
  validateBusinessConfigSchema,
} from "#modules/schema/utils";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
  VALID_CONFIGURATION_WITHOUT_DEFAULTS,
} from "#test/fixtures/configuration-schema";

import type { BusinessConfigSchema } from "#modules/schema/types";

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

    test("should accept a field without an env property", () => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "anyFlavor", type: "text", label: "Any Flavor" },
        ]),
      ).not.toThrow();
    });

    test.each<{ env: ("paas" | "saas")[] }>([
      { env: ["saas"] },
      { env: ["paas"] },
      { env: ["paas", "saas"] },
    ])("should accept a field with env $env", ({ env }) => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "scoped", type: "text", label: "Scoped", env },
        ]),
      ).not.toThrow();
    });

    test("should reject an empty env array", () => {
      expect(() =>
        validateBusinessConfigSchema([
          { name: "scoped", type: "text", label: "Scoped", env: [] },
        ]),
      ).toThrow();
    });

    test("should reject an env entry that is not a known flavor", () => {
      expect(() =>
        validateBusinessConfigSchema([
          {
            name: "scoped",
            type: "text",
            label: "Scoped",
            env: ["onprem" as never],
          },
        ]),
      ).toThrow();
    });
  });

  describe("filterBusinessConfigSchemaByFlavor", () => {
    const schema = [
      { name: "shared", type: "text", label: "Shared" },
      { name: "saasOnly", type: "text", label: "SaaS Only", env: ["saas"] },
      { name: "paasOnly", type: "text", label: "PaaS Only", env: ["paas"] },
      {
        name: "explicitBoth",
        type: "text",
        label: "Both",
        env: ["paas", "saas"],
      },
    ] satisfies BusinessConfigSchema;

    test("should include fields without env and SaaS-scoped fields when filtering by saas", () => {
      const result = filterBusinessConfigSchemaByFlavor(schema, "saas");

      expect(result.map((field) => field.name)).toEqual([
        "shared",
        "saasOnly",
        "explicitBoth",
      ]);
    });

    test("should include fields without env and PaaS-scoped fields when filtering by paas", () => {
      const result = filterBusinessConfigSchemaByFlavor(schema, "paas");

      expect(result.map((field) => field.name)).toEqual([
        "shared",
        "paasOnly",
        "explicitBoth",
      ]);
    });

    test("should preserve the order of the input schema", () => {
      const result = filterBusinessConfigSchemaByFlavor(schema, "saas");
      const inputOrder = schema.map((field) => field.name);
      const resultOrder = result.map((field) => field.name);

      expect(resultOrder).toEqual(inputOrder.filter((n) => n !== "paasOnly"));
    });

    test("should return an empty array when the schema is empty", () => {
      expect(filterBusinessConfigSchemaByFlavor([], "saas")).toEqual([]);
    });
  });
});
