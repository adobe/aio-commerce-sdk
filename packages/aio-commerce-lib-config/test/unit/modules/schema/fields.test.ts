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

import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  RecordedSchemaBusinessConfigSchema,
  SchemaBusinessConfigSchema,
} from "#modules/schema/fields";

const dynamicListField = {
  default: (opts: { value: string }[]) => opts[0].value,
  name: "paymentMethod",
  options: () => [{ label: "Braintree", value: "braintree" }],
  selectionMode: "single",
  type: "dynamicList",
};

// What `dynamicListField` looks like after a JSON round trip through storage:
// `JSON.stringify` drops function-valued properties entirely.
const recordedDynamicListField = {
  name: "paymentMethod",
  selectionMode: "single",
  type: "dynamicList",
};

const multipleDynamicListField = {
  default: (opts: { value: string }[]) => opts.map((o) => o.value),
  name: "paymentMethods",
  options: () => [{ label: "Braintree", value: "braintree" }],
  selectionMode: "multiple",
  type: "dynamicList",
};

const recordedMultipleDynamicListField = {
  name: "paymentMethods",
  selectionMode: "multiple",
  type: "dynamicList",
};

describe("SchemaBusinessConfigSchema", () => {
  test.each([true, false])("preserves required: %s", (required) => {
    const result = v.parse(SchemaBusinessConfigSchema, [
      { name: "example", required, type: "text" },
    ]);
    expect(result[0].required).toBe(required);
  });

  test("rejects a non-boolean required flag", () => {
    expect(
      v.safeParse(SchemaBusinessConfigSchema, [
        { name: "example", required: "true", type: "text" },
      ]).success,
    ).toBe(false);
  });

  test("preserves lifecycle requirements and rejects unknown operations", () => {
    const field = {
      name: "example",
      requiredFor: ["installation", "upgrade"],
      type: "text",
    };
    expect(v.parse(SchemaBusinessConfigSchema, [field])[0].requiredFor).toEqual(
      ["installation", "upgrade"],
    );
    expect(
      v.safeParse(SchemaBusinessConfigSchema, [
        { ...field, requiredFor: ["install"] },
      ]).success,
    ).toBe(false);
  });

  test.each([
    ["https://example.com", true],
    ["HTTPS://example.com", true],
    ["http\u017F://example.com", false],
  ])("validates the ASCII URL scheme in %s", (url, expected) => {
    const result = v.safeParse(SchemaBusinessConfigSchema, [
      {
        description: `[Link](${url})`,
        name: "example",
        type: "text",
      },
    ]);
    expect(result.success).toBe(expected);
  });

  test("accepts a dynamicList field with function options and default", () => {
    const result = v.safeParse(SchemaBusinessConfigSchema, [dynamicListField]);
    expect(result.success).toBe(true);
  });

  test("accepts a multiple-selection dynamicList field with function options and default", () => {
    const result = v.safeParse(SchemaBusinessConfigSchema, [
      multipleDynamicListField,
    ]);
    expect(result.success).toBe(true);
  });

  test("rejects a dynamicList field that lost its options/default functions", () => {
    const result = v.safeParse(SchemaBusinessConfigSchema, [
      recordedDynamicListField,
    ]);
    expect(result.success).toBe(false);
  });
});

describe("RecordedSchemaBusinessConfigSchema", () => {
  test("preserves required on recorded dynamic lists", () => {
    const result = v.parse(RecordedSchemaBusinessConfigSchema, [
      { ...recordedDynamicListField, required: true },
    ]);
    expect(result[0].required).toBe(true);
  });

  test("accepts a dynamicList field with function options and default", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      dynamicListField,
    ]);
    expect(result.success).toBe(true);
  });

  test("accepts a dynamicList field recovered from storage without options/default", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      recordedDynamicListField,
    ]);
    expect(result.success).toBe(true);
  });

  test("accepts a multiple-selection dynamicList field with function options and default", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      multipleDynamicListField,
    ]);
    expect(result.success).toBe(true);
  });

  test("accepts a multiple-selection dynamicList field recovered from storage without options/default", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      recordedMultipleDynamicListField,
    ]);
    expect(result.success).toBe(true);
  });

  test("rejects a dynamicList field with a non-function options property", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      { ...recordedDynamicListField, options: "not-a-function" },
    ]);
    expect(result.success).toBe(false);
  });

  test("rejects a field missing the required name", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      { selectionMode: "single", type: "dynamicList" },
    ]);
    expect(result.success).toBe(false);
  });

  test("rejects an invalid selectionMode", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      { ...recordedDynamicListField, selectionMode: "bogus" },
    ]);
    expect(result.success).toBe(false);
  });

  test("still validates non-dynamicList field types strictly", () => {
    const result = v.safeParse(RecordedSchemaBusinessConfigSchema, [
      { name: "apiKey", options: [{ label: "A" }], type: "list" },
    ]);
    expect(result.success).toBe(false);
  });
});
