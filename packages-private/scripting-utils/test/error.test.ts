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

import { stringifyError } from "#error";

describe("stringifyError", () => {
  test("should stringify Error objects", () => {
    const error = new Error("Test error message");
    const result = stringifyError(error);
    expect(result).toBe("Test error message");
  });

  test("should stringify string errors", () => {
    const error = "String error";
    const result = stringifyError(error);
    expect(result).toBe("String error");
  });

  test("should stringify number errors", () => {
    const error = 42;
    const result = stringifyError(error);
    expect(result).toBe("42");
  });

  test("should stringify boolean errors", () => {
    const error = true;
    const result = stringifyError(error);
    expect(result).toBe("true");
  });

  test("should stringify null", () => {
    const error: null = null;
    const result = stringifyError(error);
    expect(result).toBe("null");
  });

  test("should stringify undefined", () => {
    const error = undefined;
    const result = stringifyError(error);
    expect(result).toBe("undefined");
  });

  test("should stringify object errors", () => {
    const error = { code: "ERR_001", message: "Custom error" };
    const result = stringifyError(error);
    expect(result).toBe("[object Object]");
  });

  test("should stringify array errors", () => {
    const error = ["error1", "error2"];
    const result = stringifyError(error);
    expect(result).toBe("error1,error2");
  });

  test("should handle Error with empty message", () => {
    // biome-ignore lint/suspicious/useErrorMessage: we want to test the empty message
    const error = new Error("");
    const result = stringifyError(error);
    expect(result).toBe("");
  });

  test("should handle custom Error subclasses", () => {
    class CustomError extends Error {
      public constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error = new CustomError("Custom error message");
    const result = stringifyError(error);
    expect(result).toBe("Custom error message");
  });

  test("should handle CommerceSdkValidationError by calling display()", () => {
    // Create a mock validation error with minimal valid issues
    const error = new CommerceSdkValidationError("Validation failed", {
      issues: [
        {
          kind: "validation",
          type: "custom",
          input: null,
          expected: "string",
          received: "null",
          message: "Field is required",
          path: [
            {
              type: "object",
              origin: "value",
              input: {},
              key: "field1",
              value: null,
            },
          ],
        },
      ],
    });

    const result = stringifyError(error);
    expect(result).toContain("Validation failed");
  });
});
