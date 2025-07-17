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

import ansis from "ansis";
import {
  boolean,
  type GenericIssue,
  number,
  object,
  safeParse,
  string,
} from "valibot";
import { describe, expect, test } from "vitest";
import { CommerceSdkValidationError } from "~/lib/validation";

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
    const result = safeParse(SimpleObjectSchema, simpleObject) as {
      issues: GenericIssue[];
    };

    const validationError = new CommerceSdkValidationError(
      "Validation failed",
      {
        issues: result.issues,
      },
    );

    const output = ansis.strip(validationError.display());

    expect(output).toMatch(
      /Schema validation error at key1 → Invalid key: Expected "key1" but received undefined/g,
    );
    expect(output).toMatch(
      /Schema validation error at key2 → Invalid key: Expected "key2" but received undefined/g,
    );
    expect(output).toMatch(
      /Schema validation error at key3.nestedKey.nestedKey → Invalid type: Expected boolean but received/g,
    );
  });
});
