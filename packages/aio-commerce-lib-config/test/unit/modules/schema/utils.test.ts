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
import type {
  BusinessConfigSchema,
  BusinessConfigSchemaListOption,
} from "#modules/schema/types";

const mockParams: RuntimeActionParams = {
  LOG_LEVEL: "info",
};

const BOOM_FIELD_NAME_RE = /"boom"/;

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
          { name: "anyEnv", type: "text", label: "Any Env" },
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

    test("should reject an env entry that is not a known commerce environment", () => {
      expect(() =>
        validateBusinessConfigSchema([
          {
            name: "scoped",
            type: "text",
            label: "Scoped",
            // @ts-expect-error - Testing an invalid value on purpose
            env: ["onprem"],
          },
        ] satisfies BusinessConfigSchema),
      ).toThrow();
    });

    test("rejects javascript: links in field description", () => {
      expect(() =>
        validateBusinessConfigSchema([
          {
            name: "my-field",
            type: "text",
            description: "See [docs](javascript:evil()) for details",
          },
        ]),
      ).toThrow();
    });

    test("preserves valid https links in field description", () => {
      const result = validateBusinessConfigSchema([
        {
          name: "my-field",
          type: "text",
          description: "Click [here](https://example.com) for more",
        },
      ]);

      expect(result[0]?.description).toBe(
        "Click [here](https://example.com) for more",
      );
    });
  });

  describe("hasDynamicSchema", () => {
    test("returns false on an all-static schema", () => {
      expect(hasDynamicSchema(VALID_CONFIGURATION)).toBe(false);
    });

    test("returns true when a dynamicList field is present", () => {
      const schema: BusinessConfigSchema = [
        {
          name: "paymentMethod",
          type: "dynamicList",
          selectionMode: "single",
          options: () => [{ label: "Braintree", value: "braintree" }],
          default: (opts) => opts[0].value,
        },
      ];
      expect(hasDynamicSchema(schema)).toBe(true);
    });
  });

  describe("resolveBusinessConfigSchema", () => {
    const SINGLE_OPTION = [{ label: "A", value: "a" }];
    const pickFirstOption = (opts: BusinessConfigSchemaListOption[]) =>
      opts[0].value;

    test("passes static fields through unchanged", async () => {
      const validated = validateBusinessConfigSchema(VALID_CONFIGURATION);
      const resolved = await resolveBusinessConfigSchema(validated, mockParams);
      expect(resolved).toEqual(validated);
    });

    test("resolves a sync single-select dynamicList factory", async () => {
      const schema: BusinessConfigSchema = [
        {
          name: "paymentMethod",
          label: "Payment Method",
          type: "dynamicList",
          selectionMode: "single",
          options: () => [
            { label: "Braintree", value: "braintree" },
            { label: "PayPal", value: "paypal" },
          ],
          default: pickFirstOption,
        },
      ];

      const [resolved] = await resolveBusinessConfigSchema(schema, mockParams);
      expect(resolved).toEqual({
        name: "paymentMethod",
        label: "Payment Method",
        type: "list",
        selectionMode: "single",
        options: [
          { label: "Braintree", value: "braintree" },
          { label: "PayPal", value: "paypal" },
        ],
        default: "braintree",
      });
    });

    test("awaits async option factories", async () => {
      const schema: BusinessConfigSchema = [
        {
          name: "asyncField",
          type: "dynamicList",
          selectionMode: "single",
          options: async () => [{ label: "One", value: "one" }],
          default: pickFirstOption,
        },
      ];

      const [resolved] = await resolveBusinessConfigSchema(schema, mockParams);
      expect.assert(resolved.type === "list");
      expect(resolved.options).toEqual([{ label: "One", value: "one" }]);
    });

    test("passes the resolved options to the default factory", async () => {
      const seen: unknown[] = [];
      const schema: BusinessConfigSchema = [
        {
          name: "paymentMethods",
          type: "dynamicList",
          selectionMode: "multiple",
          options: () => [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
          ],
          default: (opts) => {
            seen.push(opts);
            return opts.map((o) => o.value);
          },
        },
      ];

      const [resolved] = await resolveBusinessConfigSchema(schema, mockParams);
      expect(seen).toEqual([
        [
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ],
      ]);
      expect.assert(resolved.type === "list");
      expect(resolved.default).toEqual(["a", "b"]);
    });

    test("falls back to [] when selectionMode is multiple and no default is set", async () => {
      const schema: BusinessConfigSchema = [
        {
          name: "paymentMethods",
          type: "dynamicList",
          selectionMode: "multiple",
          options: () => SINGLE_OPTION,
        },
      ];

      const [resolved] = await resolveBusinessConfigSchema(schema, mockParams);
      expect.assert(resolved.type === "list");
      expect(resolved.default).toEqual([]);
    });

    test("schema validation rejects single-mode dynamicList without a default", () => {
      const schema = [
        {
          name: "noDefault",
          type: "dynamicList",
          selectionMode: "single",
          options: () => SINGLE_OPTION,
        },
      ];

      expect(() => validateBusinessConfigSchema(schema)).toThrow();
    });

    test("propagates errors from option factories with field name in message", async () => {
      const cause = new Error("upstream failure");
      const schema: BusinessConfigSchema = [
        {
          name: "boom",
          type: "dynamicList",
          selectionMode: "single",
          options: () => {
            throw cause;
          },
          default: (opts) => opts[0]?.value ?? "",
        },
      ];

      await expect(
        resolveBusinessConfigSchema(schema, mockParams),
      ).rejects.toThrow(BOOM_FIELD_NAME_RE);
    });

    test("throws when factory returns malformed options", async () => {
      const schema: BusinessConfigSchema = [
        {
          name: "badShape",
          type: "dynamicList",
          selectionMode: "single",
          // @ts-expect-error - Testing an invalid value on purpose
          options: () => [{ label: 42 }],
          default: () => "x",
        },
      ];

      await expect(
        resolveBusinessConfigSchema(schema, mockParams),
      ).rejects.toThrow();
    });

    test("does not mutate the input schema", async () => {
      const factory = () => SINGLE_OPTION;
      const schema: BusinessConfigSchema = [
        {
          name: "field",
          type: "dynamicList",
          selectionMode: "single",
          options: factory,
          default: pickFirstOption,
        },
      ];
      const snapshot = JSON.parse(
        JSON.stringify(schema, (_k, v) =>
          typeof v === "function" ? "[function]" : v,
        ),
      );

      await resolveBusinessConfigSchema(schema, mockParams);

      const after = JSON.parse(
        JSON.stringify(schema, (_k, v) =>
          typeof v === "function" ? "[function]" : v,
        ),
      );
      expect(after).toEqual(snapshot);
      const [field] = schema;
      expect.assert(field.type === "dynamicList");
      expect(field.options).toBe(factory);
    });
  });
});
