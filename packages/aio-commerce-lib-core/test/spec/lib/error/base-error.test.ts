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

import { describe, expect, it } from "vitest";

import {
  CommerceSdkErrorBase,
  type CommerceSdkErrorBaseOptions,
} from "~/lib/error/base-error";

// Create a concrete implementation for testing
class TestError extends CommerceSdkErrorBase {
  public constructor(message: string, options?: CommerceSdkErrorBaseOptions) {
    super(message, options ?? {});
  }
}

describe("CommerceSdkErrorBase", () => {
  describe("constructor", () => {
    it("should create an error with message", () => {
      const error = new TestError("Test error message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CommerceSdkErrorBase);
      expect(error.message).toBe("Test error message");
      expect(error.name).toBe("TestError");
    });

    it("should create an error with traceId", () => {
      const error = new TestError("Test error", { traceId: "trace-123" });
      expect(error.traceId).toBe("trace-123");
    });

    it("should create an error with cause", () => {
      const cause = new Error("Cause error");
      const error = new TestError("Test error", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should capture stack trace", () => {
      const error = new TestError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("TestError: Test error");
    });

    it("should set prototype correctly", () => {
      const error = new TestError("Test error");
      expect(Object.getPrototypeOf(error)).toBe(TestError.prototype);
    });

    it("should automatically set name from constructor", () => {
      class MyCustomError extends CommerceSdkErrorBase {}
      const error = new MyCustomError("Test error", {});

      expect(error.name).toBe("MyCustomError");
    });

    it("should use variable name if constructor name is not available", () => {
      // Create an anonymous class
      const AnonymousError = class extends CommerceSdkErrorBase {};
      const error = new AnonymousError("Test error", {});

      // Anonymous classes may still have a name in some environments
      expect(error.name).toBeDefined();
      expect(error.name).toBe("AnonymousError");
    });

    it("should use fallback name if constructor name and variable name are not available", () => {
      expect(
        new (class extends CommerceSdkErrorBase {})("Test error", {}).name,
      ).toBe("CommerceSdkError");
    });
  });

  describe("static isSdkError()", () => {
    it("should return true for CommerceSdkErrorBase instances", () => {
      const error = new TestError("Test error");
      expect(CommerceSdkErrorBase.isSdkError(error)).toBe(true);
    });

    it("should return false for regular Error instances", () => {
      const error = new Error("Regular error");
      expect(CommerceSdkErrorBase.isSdkError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(CommerceSdkErrorBase.isSdkError("string")).toBe(false);
      expect(CommerceSdkErrorBase.isSdkError(123)).toBe(false);
      expect(CommerceSdkErrorBase.isSdkError(null)).toBe(false);
      expect(CommerceSdkErrorBase.isSdkError(undefined)).toBe(false);
      expect(CommerceSdkErrorBase.isSdkError({})).toBe(false);
    });
  });

  describe("fullStack getter", () => {
    it("should return stack trace for single error", () => {
      const error = new TestError("Test error");
      const fullStack = error.fullStack;

      expect(fullStack).toBeDefined();
      expect(fullStack).toContain("TestError: Test error");
    });

    it("should return stack trace with single cause", () => {
      const cause = new Error("Cause error");
      const error = new TestError("Test error", { cause });
      const fullStack = error.fullStack;

      expect(fullStack).toContain("TestError: Test error");
      expect(fullStack).toContain("Caused by: Error: Cause error");
    });

    it("should return stack trace with nested causes", () => {
      const rootCause = new Error("Root cause");
      const middleCause = new Error("Middle cause");
      Object.defineProperty(middleCause, "cause", { value: rootCause });

      const error = new TestError("Test error", { cause: middleCause });
      const fullStack = error.fullStack;

      expect(fullStack).toContain("TestError: Test error");
      expect(fullStack).toContain("Caused by: Error: Middle cause");
      expect(fullStack).toContain("Caused by: Error: Root cause");
    });

    it("should handle error without stack trace", () => {
      const error = new TestError("Test error");
      Object.defineProperty(error, "stack", { value: undefined });

      expect(error.fullStack).toBe("");
    });

    it("should handle cause without stack trace", () => {
      const cause = new Error("Cause error");
      Object.defineProperty(cause, "stack", { value: undefined });

      const error = new TestError("Test error", { cause });
      expect(error.fullStack).toContain("Caused by: Cause error");
    });
  });

  describe("rootCause getter", () => {
    it("should return undefined for error without cause", () => {
      const error = new TestError("Test error");
      expect(error.rootCause).toBeUndefined();
    });

    it("should return direct cause for single level", () => {
      const cause = new Error("Cause error");
      const error = new TestError("Test error", { cause });

      expect(error.rootCause).toBe(cause);
    });

    it("should return root cause for nested errors", () => {
      const rootCause = new Error("Root cause");
      const middleCause = new Error("Middle cause");
      Object.defineProperty(middleCause, "cause", { value: rootCause });

      const error = new TestError("Test error", { cause: middleCause });
      expect(error.rootCause).toBe(rootCause);
    });

    it("should return non-Error cause", () => {
      const nonErrorCause = { reason: "Something went wrong" };
      const error = new TestError("Test error", { cause: nonErrorCause });

      expect(error.rootCause).toBe(nonErrorCause);
    });
  });

  describe("toJSON()", () => {
    it("should return JSON representation with all properties", () => {
      const cause = new Error("Cause error");
      const error = new TestError("Test error", {
        traceId: "trace-123",
        cause,
      });

      const json = error.toJSON();
      expect(json).toEqual({
        name: "TestError",
        message: "Test error",
        stack: expect.stringContaining("TestError: Test error"),
        cause,
        traceId: "trace-123",
      });
    });

    it("should return JSON representation without optional properties", () => {
      const error = new TestError("Test error");
      const json = error.toJSON();

      expect(json).toEqual({
        name: "TestError",
        message: "Test error",
        stack: expect.stringContaining("TestError: Test error"),
        cause: undefined,
        traceId: undefined,
      });
    });

    it("should be serializable with JSON.stringify", () => {
      const error = new TestError("Test error", { traceId: "trace-123" });
      const jsonString = JSON.stringify(error);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe("TestError");
      expect(parsed.message).toBe("Test error");
      expect(parsed.traceId).toBe("trace-123");
    });
  });

  describe("toString()", () => {
    it("should return inspected string by default", () => {
      const error = new TestError("Test error", { traceId: "trace-123" });
      const string = error.toString();

      // The inspect output includes color codes and formatting
      expect(string).toContain("TestError");
      expect(string).toContain("Test error");
      expect(string).toContain("trace-123");
    });

    it("should return simple string when inspect is false", () => {
      const error = new TestError("Test error");
      const string = error.toString(false);

      expect(string).toBe("TestError: Test error");
    });

    it("should handle complex error structures in inspect mode", () => {
      const cause = new Error("Cause error");
      const error = new TestError("Test error", {
        traceId: "trace-123",
        cause,
      });

      const string = error.toString();
      expect(string).toContain("TestError");
      expect(string).toContain("Test error");
      expect(string).toContain("trace-123");
      expect(string).toContain("cause");
    });
  });

  describe("inheritance", () => {
    it("should work with custom error classes", () => {
      class CustomError extends CommerceSdkErrorBase {
        public readonly code: string;

        public constructor(
          message: string,
          code: string,
          options?: { traceId?: string },
        ) {
          super(message, options || {});
          this.code = code;
        }
      }

      const error = new CustomError("Custom error", "ERR_001", {
        traceId: "trace-123",
      });

      expect(error).toBeInstanceOf(CommerceSdkErrorBase);
      expect(error.name).toBe("CustomError");
      expect(error.code).toBe("ERR_001");
      expect(error.traceId).toBe("trace-123");
      expect(CommerceSdkErrorBase.isSdkError(error)).toBe(true);
    });

    it("should maintain instanceof checks through inheritance chain", () => {
      class Level1Error extends CommerceSdkErrorBase {}
      class Level2Error extends Level1Error {}

      const error = new Level2Error("Test error", {});

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CommerceSdkErrorBase);
      expect(error).toBeInstanceOf(Level1Error);
      expect(error).toBeInstanceOf(Level2Error);
    });
  });

  describe("Error.captureStackTrace compatibility", () => {
    it("should handle environments without captureStackTrace", () => {
      const originalCaptureStackTrace = Error.captureStackTrace;

      // Temporarily remove captureStackTrace
      Object.defineProperty(Error, "captureStackTrace", {
        value: undefined,
        configurable: true,
      });

      const error = new TestError("Test error");

      expect(error.stack).toBeDefined();
      expect(() => error.fullStack).not.toThrow();

      // Restore captureStackTrace
      if (originalCaptureStackTrace) {
        Object.defineProperty(Error, "captureStackTrace", {
          value: originalCaptureStackTrace,
          configurable: true,
        });
      }
    });
  });
});
