/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
  type BaseIssue,
  boolean,
  number,
  object,
  safeParse,
  string,
} from "valibot";
import { describe, expect, test } from "vitest";

import { ValidationError } from "~/lib/validation";

describe("utils", () => {
  test("should summarize a list of issues with colors and structure", () => {
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
    const result = safeParse(SimpleObjectSchema, simpleObject);
    const output = new ValidationError(
      "Validation error",
      result.issues as [BaseIssue<unknown>, ...BaseIssue<unknown>[]],
    ).toString();
    expect(output).toContain("key1");
    expect(output).toContain("key2");
    expect(output).toContain("key3.nestedKey.nestedKey");
  });
});
