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
