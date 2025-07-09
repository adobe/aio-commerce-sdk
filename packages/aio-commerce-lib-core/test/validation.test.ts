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

import { boolean, number, object, safeParse, string } from "valibot";
import { describe, expect, test } from "vitest";

import {
  makeValidationError,
  summarizeValidationError,
} from "~/lib/validation";

const SimpleObjectSchema = object({
  key1: string(),
  key2: number(),
  key3: object({
    nestedKey: object({
      nestedKey: boolean(),
    }),
  }),
});

const simpleObject = {
  key3: {
    nestedKey: {
      nestedKey: "nestedKey",
    },
  },
};

describe("aio-commerce-lib-core/validation", () => {
  test("should summarize a list of issues with colors and structure", () => {
    const result = safeParse(SimpleObjectSchema, simpleObject);

    if (!result.success) {
      // `result.issues` is only satisfied if the validation fails.
      const validationError = makeValidationError(
        "Validation failed",
        result.issues,
      );

      const output = summarizeValidationError(validationError);
      expect(output).toContain("key1");
      expect(output).toContain("key2");
      expect(output).toContain("key3.nestedKey.nestedKey");
    }
  });

  test("should make a validation error", () => {
    const result = safeParse(SimpleObjectSchema, simpleObject);

    if (!result.success) {
      const validationError = makeValidationError(
        "Validation failed",
        result.issues,
      );

      expect(validationError._tag).toBe("ValidationError");
      expect(validationError.message).toBe("Validation failed");
      expect(validationError.issues.length).toBeGreaterThan(0);
    }
  });
});
