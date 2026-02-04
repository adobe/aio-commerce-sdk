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
import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  alphaNumericOrHyphenSchema,
  alphaNumericOrUnderscoreOrHyphenSchema,
  alphaNumericOrUnderscoreSchema,
  booleanValueSchema,
  nonEmptyStringValueSchema,
  stringValueSchema,
  titleCaseSchema,
} from "#valibot/schemas";
import { parseOrThrow } from "#valibot/utils";

const SimpleObjectSchema = v.object({
  foo: v.string(),
});

describe("parseOrThrow", () => {
  it("should not throw and return expected object", () => {
    const input = { foo: "bar" };
    expect(parseOrThrow(SimpleObjectSchema, input)).toEqual({ foo: "bar" });
  });

  it("should throw CommerceSdkValidationError", () => {
    expect(() => parseOrThrow(SimpleObjectSchema, { foo: 123 })).toThrowError(
      CommerceSdkValidationError,
    );
  });

  it("should throw CommerceSdkValidationError with custom message", () => {
    const customMessage = "Custom validation error message";
    try {
      parseOrThrow(SimpleObjectSchema, { foo: 123 }, customMessage);
    } catch (error) {
      expect(error).toBeInstanceOf(CommerceSdkValidationError);
      expect((error as CommerceSdkValidationError).message).toBe(customMessage);
    }
  });
});

describe("stringValueSchema", () => {
  const schema = stringValueSchema("testField");

  it.each([
    { value: "test", description: "string values" },
    { value: "", description: "empty strings" },
  ])("should accept $description", ({ value }) => {
    expect(() => v.parse(schema, value)).not.toThrow();
  });

  it.each([
    { value: 123, description: "numbers" },
    { value: true, description: "booleans" },
    { value: null, description: "null" },
  ])("should reject $description", ({ value }) => {
    expect(() => v.parse(schema, value)).toThrow();
  });
});

describe("nonEmptyStringValueSchema", () => {
  const schema = nonEmptyStringValueSchema("testField");

  it("should accept non-empty string values", () => {
    expect(() => v.parse(schema, "test")).not.toThrow();
  });

  it.each([
    { value: "", description: "empty strings" },
    { value: 123, description: "numbers" },
  ])("should reject $description", ({ value }) => {
    expect(() => v.parse(schema, value)).toThrow();
  });
});

describe("booleanValueSchema", () => {
  const schema = booleanValueSchema("testField");

  it.each([
    { value: true, description: "true" },
    { value: false, description: "false" },
  ])("should accept $description", ({ value }) => {
    expect(() => v.parse(schema, value)).not.toThrow();
  });

  it.each([
    { value: "true", description: "string 'true'" },
    { value: 1, description: "number 1" },
    { value: null, description: "null" },
  ])("should reject $description", ({ value }) => {
    expect(() => v.parse(schema, value)).toThrow();
  });
});

describe("alphaNumericOrUnderscoreSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField");

    it.each([
      {
        value: "test_value_123",
        description: "lowercase alphanumeric with underscores",
      },
      {
        value: "TEST_VALUE_123",
        description: "uppercase alphanumeric with underscores",
      },
      {
        value: "Test_Value_123",
        description: "mixed case alphanumeric with underscores",
      },
    ])("should accept $description", ({ value }) => {
      expect(() => v.parse(schema, value)).not.toThrow();
    });

    it.each([
      { value: "test-value", description: "strings with hyphens" },
      { value: "test@value", description: "strings with special characters" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField", "lowercase");

    it("should accept lowercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "test_value_123")).not.toThrow();
    });

    it.each([
      { value: "TEST_VALUE", description: "uppercase letters" },
      { value: "Test_Value", description: "mixed case" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });

    it("should include casing info in error message", () => {
      try {
        v.parse(schema, "TEST_VALUE");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toHaveProperty("issues");
        expect((error as any).issues[0].message).toContain("lowercase only");
      }
    });
  });

  describe("with uppercase casing", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField", "uppercase");

    it("should accept uppercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "TEST_VALUE_123")).not.toThrow();
    });

    it.each([
      { value: "test_value", description: "lowercase letters" },
      { value: "Test_Value", description: "mixed case" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });

    it("should include casing info in error message", () => {
      try {
        v.parse(schema, "test_value");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toHaveProperty("issues");
        expect((error as any).issues[0].message).toContain("uppercase only");
      }
    });
  });
});

describe("alphaNumericOrUnderscoreOrHyphenSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrUnderscoreOrHyphenSchema("testField");

    it.each([
      {
        value: "test-value_123",
        description: "lowercase alphanumeric with underscores and hyphens",
      },
      {
        value: "TEST-VALUE_123",
        description: "uppercase alphanumeric with underscores and hyphens",
      },
      {
        value: "Test-Value_123",
        description: "mixed case alphanumeric with underscores and hyphens",
      },
    ])("should accept $description", ({ value }) => {
      expect(() => v.parse(schema, value)).not.toThrow();
    });

    it("should reject strings with special characters", () => {
      expect(() => v.parse(schema, "test@value")).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrUnderscoreOrHyphenSchema(
      "testField",
      "lowercase",
    );

    it("should accept lowercase alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "test-value_123")).not.toThrow();
    });

    it.each([
      { value: "TEST-VALUE", description: "uppercase letters" },
      { value: "Test-Value", description: "mixed case" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });
  });

  describe("with uppercase casing", () => {
    const schema = alphaNumericOrUnderscoreOrHyphenSchema(
      "testField",
      "uppercase",
    );

    it("should accept uppercase alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "TEST-VALUE_123")).not.toThrow();
    });

    it.each([
      { value: "test-value", description: "lowercase letters" },
      { value: "Test-Value", description: "mixed case" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });
  });
});

describe("alphaNumericOrHyphenSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrHyphenSchema("testField");

    it.each([
      {
        value: "test-value-123",
        description: "lowercase alphanumeric with hyphens",
      },
      {
        value: "TEST-VALUE-123",
        description: "uppercase alphanumeric with hyphens",
      },
      {
        value: "Test-Value-123",
        description: "mixed case alphanumeric with hyphens",
      },
    ])("should accept $description", ({ value }) => {
      expect(() => v.parse(schema, value)).not.toThrow();
    });

    it.each([
      { value: "test_value", description: "strings with underscores" },
      { value: "test@value", description: "strings with special characters" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrHyphenSchema("testField", "lowercase");

    it("should accept lowercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "test-value-123")).not.toThrow();
    });

    it.each([
      { value: "TEST-VALUE", description: "uppercase letters" },
      { value: "Test-Value", description: "mixed case" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });

    it("should include casing info in error message", () => {
      try {
        v.parse(schema, "TEST-VALUE");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toHaveProperty("issues");
        expect((error as any).issues[0].message).toContain("lowercase only");
      }
    });
  });

  describe("with uppercase casing", () => {
    const schema = alphaNumericOrHyphenSchema("testField", "uppercase");

    it("should accept uppercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "TEST-VALUE-123")).not.toThrow();
    });

    it.each([
      { value: "test-value", description: "lowercase letters" },
      { value: "Test-Value", description: "mixed case" },
    ])("should reject $description", ({ value }) => {
      expect(() => v.parse(schema, value)).toThrow();
    });

    it("should include casing info in error message", () => {
      try {
        v.parse(schema, "test-value");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toHaveProperty("issues");
        expect((error as any).issues[0].message).toContain("uppercase only");
      }
    });
  });
});

describe("titleCaseSchema", () => {
  const schema = titleCaseSchema("testField");

  it.each([
    { value: "Commerce", description: "single word in Title Case" },
    { value: "My Provider", description: "multiple words in Title Case" },
    {
      value: "Order Events Handler",
      description: "multiple words with longer names",
    },
  ])("should accept $description", ({ value }) => {
    expect(() => v.parse(schema, value)).not.toThrow();
  });

  it.each([
    { value: "my provider", description: "all lowercase" },
    { value: "MY PROVIDER", description: "all uppercase" },
    { value: "myProvider", description: "camelCase" },
    { value: "my Provider", description: "lowercase first word" },
    { value: "My provider", description: "lowercase subsequent word" },
    { value: "Provider123", description: "strings with numbers" },
    { value: "My-Provider", description: "strings with hyphens" },
    { value: "My_Provider", description: "strings with underscores" },
    { value: "My@Provider", description: "strings with special characters" },
    { value: "", description: "empty strings" },
    { value: "My  Provider", description: "multiple spaces between words" },
  ])("should reject $description", ({ value }) => {
    expect(() => v.parse(schema, value)).toThrow();
  });

  it("should include Title Case info in error message", () => {
    try {
      v.parse(schema, "my provider");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toHaveProperty("issues");
      expect((error as any).issues[0].message).toContain("Title Case");
    }
  });
});
