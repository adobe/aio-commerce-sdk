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

import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { parseOrThrow } from "~/valibot";

const SimpleObjectSchema = v.object({
  foo: v.string(),
});

describe("parseOrThrow", () => {
  it("should not throw and return expected object", () => {
    const input = { foo: "bar" };
    expect(parseOrThrow(SimpleObjectSchema, input)).toEqual({ foo: "bar" });
  });

  it("should throw CommerceSdkValidationError on invalid input", () => {
    const input = { foo: 123 };
    expect(() => parseOrThrow(SimpleObjectSchema, input)).toThrowError(
      "Invalid input",
    );
  });
});
