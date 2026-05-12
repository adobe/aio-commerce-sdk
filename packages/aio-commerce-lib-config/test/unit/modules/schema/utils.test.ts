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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { describe, expect, test } from "vitest";

import {
  hasDynamicSchema,
  resolveBusinessConfigSchema,
  validateBusinessConfigSchema,
} from "#modules/schema/utils";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
  VALID_CONFIGURATION_WITHOUT_DEFAULTS,
} from "#test/fixtures/configuration-schema";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

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

    test("should accept a list field with dynamic options", () => {
      expect(() =>
        validateBusinessConfigSchema([
          {
            name: "paymentMethod",
            type: "list",
            selectionMode: "single",
            default: "braintree",
            options: () => [{ label: "Braintree", value: "braintree" }],
          },
        ]),
      ).not.toThrow();
    });
  });

  describe("hasDynamicSchema", () => {
    test("should return true when the schema contains dynamic list options", () => {
      const schema = validateBusinessConfigSchema([
        {
          name: "paymentMethod",
          type: "list",
          selectionMode: "single",
          default: "braintree",
          options: () => [{ label: "Braintree", value: "braintree" }],
        },
      ]);

      expect(hasDynamicSchema(schema)).toBe(true);
    });

    test("should return false when the schema is static", () => {
      const schema = validateBusinessConfigSchema([
        {
          name: "paymentMethod",
          type: "list",
          selectionMode: "single",
          default: "braintree",
          options: [{ label: "Braintree", value: "braintree" }],
        },
      ]);

      expect(hasDynamicSchema(schema)).toBe(false);
    });
  });

  describe("resolveBusinessConfigSchema", () => {
    test("should resolve sync and async list option factories with runtime params", async () => {
      const schema = validateBusinessConfigSchema([
        {
          name: "paymentMethod",
          type: "list",
          selectionMode: "single",
          default: "braintree",
          options: (params: RuntimeActionParams) => [
            { label: String(params.METHOD_LABEL), value: "braintree" },
          ],
        },
        {
          name: "storeViews",
          type: "list",
          selectionMode: "multiple",
          options: async (params: RuntimeActionParams) => [
            { label: "Default", value: String(params.STORE_VIEW_CODE) },
          ],
        },
      ]);

      const result = await resolveBusinessConfigSchema(schema, {
        METHOD_LABEL: "Braintree",
        STORE_VIEW_CODE: "default",
      });

      expect(result[0]).toMatchObject({
        options: [{ label: "Braintree", value: "braintree" }],
      });
      expect(result[1]).toMatchObject({
        options: [{ label: "Default", value: "default" }],
      });
    });

    test("should preserve static fields and avoid mutating the original schema", async () => {
      const optionsFactory = () => [{ label: "Resolved", value: "resolved" }];
      const schema = validateBusinessConfigSchema([
        {
          name: "dynamic",
          type: "list",
          selectionMode: "single",
          default: "resolved",
          options: optionsFactory,
        },
        {
          name: "static",
          type: "list",
          selectionMode: "multiple",
          options: [{ label: "Static", value: "static" }],
        },
        {
          name: "text",
          type: "text",
        },
      ]);

      const result = await resolveBusinessConfigSchema(schema, {});

      expect(schema[0]).toMatchObject({ options: optionsFactory });
      expect(result).not.toBe(schema);
      expect(result[0]).toMatchObject({
        options: [{ label: "Resolved", value: "resolved" }],
      });
      expect(result[1]).toStrictEqual(schema[1]);
      expect(result[2]).toStrictEqual(schema[2]);
    });

    test("should reject invalid resolved options", async () => {
      const schema = validateBusinessConfigSchema([
        {
          name: "badOptions",
          type: "list",
          selectionMode: "single",
          default: "missing-label",
          options: () => [{ value: "missing-label" }],
        },
      ]);

      await expect(resolveBusinessConfigSchema(schema, {})).rejects.toThrow(
        'Invalid options returned for list field "badOptions"',
      );
      await expect(resolveBusinessConfigSchema(schema, {})).rejects.toThrow(
        CommerceSdkValidationError,
      );
    });

    test("should wrap factory errors with the field name", async () => {
      const schema = validateBusinessConfigSchema([
        {
          name: "badOptions",
          type: "list",
          selectionMode: "single",
          default: "value",
          options: () => {
            throw new Error("Could not load options");
          },
        },
      ]);

      await expect(resolveBusinessConfigSchema(schema, {})).rejects.toThrow(
        'Failed to resolve options for list field "badOptions"',
      );

      await resolveBusinessConfigSchema(schema, {}).catch((error) => {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).cause).toEqual(
          new Error("Could not load options"),
        );
      });
    });
  });
});
