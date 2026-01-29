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

  it("should accept string values", () => {
    expect(() => v.parse(schema, "test")).not.toThrow();
  });

  it("should accept empty strings", () => {
    expect(() => v.parse(schema, "")).not.toThrow();
  });

  it("should reject non-string values", () => {
    expect(() => v.parse(schema, 123)).toThrow();
    expect(() => v.parse(schema, true)).toThrow();
    expect(() => v.parse(schema, null)).toThrow();
  });
});

describe("nonEmptyStringValueSchema", () => {
  const schema = nonEmptyStringValueSchema("testField");

  it("should accept non-empty string values", () => {
    expect(() => v.parse(schema, "test")).not.toThrow();
  });

  it("should reject empty strings", () => {
    expect(() => v.parse(schema, "")).toThrow();
  });

  it("should reject non-string values", () => {
    expect(() => v.parse(schema, 123)).toThrow();
  });
});

describe("booleanValueSchema", () => {
  const schema = booleanValueSchema("testField");

  it("should accept boolean values", () => {
    expect(() => v.parse(schema, true)).not.toThrow();
    expect(() => v.parse(schema, false)).not.toThrow();
  });

  it("should reject non-boolean values", () => {
    expect(() => v.parse(schema, "true")).toThrow();
    expect(() => v.parse(schema, 1)).toThrow();
    expect(() => v.parse(schema, null)).toThrow();
  });
});

describe("alphaNumericOrUnderscoreSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField");

    it("should accept lowercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "test_value_123")).not.toThrow();
    });

    it("should accept uppercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "TEST_VALUE_123")).not.toThrow();
    });

    it("should accept mixed case alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "Test_Value_123")).not.toThrow();
    });

    it("should reject strings with hyphens", () => {
      expect(() => v.parse(schema, "test-value")).toThrow();
    });

    it("should reject strings with special characters", () => {
      expect(() => v.parse(schema, "test@value")).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField", "lowercase");

    it("should accept lowercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "test_value_123")).not.toThrow();
    });

    it("should reject uppercase letters", () => {
      expect(() => v.parse(schema, "TEST_VALUE")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test_Value")).toThrow();
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

    it("should reject lowercase letters", () => {
      expect(() => v.parse(schema, "test_value")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test_Value")).toThrow();
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

    it("should accept lowercase alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "test-value_123")).not.toThrow();
    });

    it("should accept uppercase alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "TEST-VALUE_123")).not.toThrow();
    });

    it("should accept mixed case alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "Test-Value_123")).not.toThrow();
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

    it("should reject uppercase letters", () => {
      expect(() => v.parse(schema, "TEST-VALUE")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
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

    it("should reject lowercase letters", () => {
      expect(() => v.parse(schema, "test-value")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
    });
  });
});

describe("alphaNumericOrHyphenSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrHyphenSchema("testField");

    it("should accept lowercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "test-value-123")).not.toThrow();
    });

    it("should accept uppercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "TEST-VALUE-123")).not.toThrow();
    });

    it("should accept mixed case alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "Test-Value-123")).not.toThrow();
    });

    it("should reject strings with underscores", () => {
      expect(() => v.parse(schema, "test_value")).toThrow();
    });

    it("should reject strings with special characters", () => {
      expect(() => v.parse(schema, "test@value")).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrHyphenSchema("testField", "lowercase");

    it("should accept lowercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "test-value-123")).not.toThrow();
    });

    it("should reject uppercase letters", () => {
      expect(() => v.parse(schema, "TEST-VALUE")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
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

    it("should reject lowercase letters", () => {
      expect(() => v.parse(schema, "test-value")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
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

describe("stringValueSchema", () => {
  const schema = stringValueSchema("testField");

  it("should accept string values", () => {
    expect(() => v.parse(schema, "test")).not.toThrow();
  });

  it("should accept empty strings", () => {
    expect(() => v.parse(schema, "")).not.toThrow();
  });

  it("should reject non-string values", () => {
    expect(() => v.parse(schema, 123)).toThrow();
    expect(() => v.parse(schema, true)).toThrow();
    expect(() => v.parse(schema, null)).toThrow();
  });
});

describe("nonEmptyStringValueSchema", () => {
  const schema = nonEmptyStringValueSchema("testField");

  it("should accept non-empty string values", () => {
    expect(() => v.parse(schema, "test")).not.toThrow();
  });

  it("should reject empty strings", () => {
    expect(() => v.parse(schema, "")).toThrow();
  });

  it("should reject non-string values", () => {
    expect(() => v.parse(schema, 123)).toThrow();
  });
});

describe("booleanValueSchema", () => {
  const schema = booleanValueSchema("testField");

  it("should accept boolean values", () => {
    expect(() => v.parse(schema, true)).not.toThrow();
    expect(() => v.parse(schema, false)).not.toThrow();
  });

  it("should reject non-boolean values", () => {
    expect(() => v.parse(schema, "true")).toThrow();
    expect(() => v.parse(schema, 1)).toThrow();
    expect(() => v.parse(schema, null)).toThrow();
  });
});

describe("alphaNumericOrUnderscoreSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField");

    it("should accept lowercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "test_value_123")).not.toThrow();
    });

    it("should accept uppercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "TEST_VALUE_123")).not.toThrow();
    });

    it("should accept mixed case alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "Test_Value_123")).not.toThrow();
    });

    it("should reject strings with hyphens", () => {
      expect(() => v.parse(schema, "test-value")).toThrow();
    });

    it("should reject strings with special characters", () => {
      expect(() => v.parse(schema, "test@value")).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrUnderscoreSchema("testField", "lowercase");

    it("should accept lowercase alphanumeric with underscores", () => {
      expect(() => v.parse(schema, "test_value_123")).not.toThrow();
    });

    it("should reject uppercase letters", () => {
      expect(() => v.parse(schema, "TEST_VALUE")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test_Value")).toThrow();
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

    it("should reject lowercase letters", () => {
      expect(() => v.parse(schema, "test_value")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test_Value")).toThrow();
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

    it("should accept lowercase alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "test-value_123")).not.toThrow();
    });

    it("should accept uppercase alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "TEST-VALUE_123")).not.toThrow();
    });

    it("should accept mixed case alphanumeric with underscores and hyphens", () => {
      expect(() => v.parse(schema, "Test-Value_123")).not.toThrow();
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

    it("should reject uppercase letters", () => {
      expect(() => v.parse(schema, "TEST-VALUE")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
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

    it("should reject lowercase letters", () => {
      expect(() => v.parse(schema, "test-value")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
    });
  });
});

describe("alphaNumericOrHyphenSchema", () => {
  describe("with default casing (any)", () => {
    const schema = alphaNumericOrHyphenSchema("testField");

    it("should accept lowercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "test-value-123")).not.toThrow();
    });

    it("should accept uppercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "TEST-VALUE-123")).not.toThrow();
    });

    it("should accept mixed case alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "Test-Value-123")).not.toThrow();
    });

    it("should reject strings with underscores", () => {
      expect(() => v.parse(schema, "test_value")).toThrow();
    });

    it("should reject strings with special characters", () => {
      expect(() => v.parse(schema, "test@value")).toThrow();
    });
  });

  describe("with lowercase casing", () => {
    const schema = alphaNumericOrHyphenSchema("testField", "lowercase");

    it("should accept lowercase alphanumeric with hyphens", () => {
      expect(() => v.parse(schema, "test-value-123")).not.toThrow();
    });

    it("should reject uppercase letters", () => {
      expect(() => v.parse(schema, "TEST-VALUE")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
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

    it("should reject lowercase letters", () => {
      expect(() => v.parse(schema, "test-value")).toThrow();
    });

    it("should reject mixed case", () => {
      expect(() => v.parse(schema, "Test-Value")).toThrow();
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
