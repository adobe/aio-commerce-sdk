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

import { NumberOutputSchema, StringArgSchema } from "#test/fixtures/schemas";
import { expectValiIssueMessage } from "#test/utils/assertions";
import {
  asyncFunctionSchema,
  syncFunctionSchema,
  syncOrAsyncFunctionSchema,
} from "#valibot/schemas/functions";

const INVALID_ARGS_MESSAGE_REGEX =
  /^The given arguments do not match the expected function signature/;

const NO_OUTPUT_MESSAGE_REGEX = /^Expected no output from this function/;
const INVALID_OUTPUT_MESSAGE_REGEX =
  /^The function does not return the expected output/;

describe.each([
  // Any test that works for syncFunctionSchema should also work for syncOrAsyncFunctionSchema.
  { name: "syncFunctionSchema", validator: syncFunctionSchema },
  {
    name: "syncOrAsyncFunctionSchema (sync tests)",
    validator: syncOrAsyncFunctionSchema,
  },
])("$name", ({ validator }) => {
  test("rejects non-function values with the function message", async () => {
    await expectValiIssueMessage(
      () => v.parse(validator(), 123),
      "The value is not a valid function",
    );
  });

  test("rejects invalid arguments with the prefixed arguments message", async () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema }),
      (_: string) => {
        // No-op
      },
    );

    await expectValiIssueMessage(
      // @ts-expect-error: Testing invalid arguments
      () => validatedFunction(123),
      INVALID_ARGS_MESSAGE_REGEX,
    );
  });

  test("includes the argument index in custom argument errors", async () => {
    const validatedFunction = v.parse(
      validator({ args: v.tuple([v.string("Not a string!")]) }),
      (_: string) => {
        // No-op
      },
    );

    await expectValiIssueMessage(
      // @ts-expect-error: Testing invalid arguments
      () => validatedFunction(123),
      "The given arguments do not match the expected function signature → arguments[0] → Not a string!",
    );
  });

  test("includes nested argument paths in custom argument errors", async () => {
    const validatedFunction = v.parse(
      validator({
        args: v.tuple([
          v.object({
            name: v.string("Not a string!"),
          }),
        ]),
      }),
      (_: { name: string }) => {
        // No-op
      },
    );

    await expectValiIssueMessage(
      // @ts-expect-error: Testing invalid nested argument property
      () => validatedFunction({ name: 123 }),
      "The given arguments do not match the expected function signature → arguments[0].name → Not a string!",
    );
  });

  test("uses the generic arguments label for tuple-level argument issues", async () => {
    const validatedFunction = v.parse(
      validator({
        args: v.pipe(
          v.tuple([]),
          v.check(() => false, "Tuple root failure"),
        ),
      }),
      () => {
        // No-op
      },
    );

    await expectValiIssueMessage(
      () => validatedFunction(),
      "The given arguments do not match the expected function signature → arguments → Tuple root failure",
    );
  });

  test("uses the dot path when a tuple-level issue is forwarded to a named argument path", async () => {
    const validatedFunction = v.parse(
      validator({
        args: v.pipe(
          v.tuple([]),
          v.forward(
            v.check(() => false, "Forwarded tuple failure"),
            ["meta"] as never,
          ),
        ),
      }),
      () => {
        // No-op
      },
    );

    await expectValiIssueMessage(
      () => validatedFunction(),
      "The given arguments do not match the expected function signature → arguments.meta → Forwarded tuple failure",
    );
  });

  test("rejects unexpected output with the no-output message", async () => {
    const validatedFunction = v.parse(validator(), () => 123);
    await expectValiIssueMessage(
      () => validatedFunction(),
      NO_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("rejects unexpected output for args-only schemas", async () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema }),
      (_: string) => 123,
    );

    await expectValiIssueMessage(
      () => validatedFunction("test"),
      NO_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("rejects invalid output with the prefixed output message", async () => {
    const validatedFunction = v.parse(
      validator({ output: NumberOutputSchema }),
      () => "123",
    );

    await expectValiIssueMessage(
      () => validatedFunction(),
      INVALID_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("rejects invalid output for args-and-output schemas", async () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema, output: NumberOutputSchema }),
      (_: string) => "123",
    );

    await expectValiIssueMessage(
      () => validatedFunction("test"),
      INVALID_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("preserves custom output errors without redundant return context", async () => {
    const validatedFunction = v.parse(
      validator({ output: v.number("Not a number!") }),
      () => "123",
    );

    await expectValiIssueMessage(
      () => validatedFunction(),
      "The function does not return the expected output → Not a number!",
    );
  });

  test("returns the validated sync output", () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema, output: NumberOutputSchema }),
      (value: string) => value.length,
    );

    expect(validatedFunction("test")).toBe(4);
  });

  test("treats an explicit empty options object like the default schema", async () => {
    const validatedFunction = v.parse(validator({}), () => 123);
    await expectValiIssueMessage(
      () => validatedFunction(),
      NO_OUTPUT_MESSAGE_REGEX,
    );
  });
});

describe.each([
  // Any test that works for asyncFunctionSchema should also work for syncOrAsyncFunctionSchema.
  { name: "asyncFunctionSchema", validator: asyncFunctionSchema },
  {
    name: "syncOrAsyncFunctionSchema (async tests)",
    validator: syncOrAsyncFunctionSchema,
  },
])("$name", ({ validator }) => {
  test("rejects non-function values with the function message", async () => {
    await expectValiIssueMessage(
      () => v.parse(validator(), 123),
      "The value is not a valid function",
    );
  });

  test("returns the validated async output", async () => {
    const validatedFunction = v.parse(
      validator({
        args: StringArgSchema,
        output: NumberOutputSchema,
      }),
      async (value: string) => value.length,
    );

    await expect(validatedFunction("test")).resolves.toBe(4);
  });

  test("rejects invalid arguments with the prefixed arguments message", async () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema }),
      async (value: string) => {
        await Promise.resolve(value.length);
      },
    );

    await expectValiIssueMessage(
      // @ts-expect-error: Testing invalid arguments
      () => validatedFunction(123),
      INVALID_ARGS_MESSAGE_REGEX,
    );
  });

  test("includes the argument index in async custom argument errors", async () => {
    const validatedFunction = v.parse(
      validator({ args: v.tuple([v.string("Not a string!")]) }),
      async (_: string) => {
        await Promise.resolve();
      },
    );

    await expectValiIssueMessage(
      // @ts-expect-error: Testing invalid arguments
      () => validatedFunction(123),
      "The given arguments do not match the expected function signature → arguments[0] → Not a string!",
    );
  });

  test("rejects invalid output with the prefixed output message", async () => {
    const validatedFunction = v.parse(
      validator({ output: NumberOutputSchema }),
      async () => "123",
    );

    await expectValiIssueMessage(
      () => validatedFunction(),
      INVALID_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("rejects unexpected output for async args-only schemas", async () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema }),
      async (_: string) => 123,
    );

    await expectValiIssueMessage(
      () => validatedFunction("test"),
      NO_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("rejects invalid output for async args-and-output schemas", async () => {
    const validatedFunction = v.parse(
      validator({ args: StringArgSchema, output: NumberOutputSchema }),
      async (_: string) => "123",
    );

    await expectValiIssueMessage(
      () => validatedFunction("test"),
      INVALID_OUTPUT_MESSAGE_REGEX,
    );
  });

  test("preserves async custom output errors without redundant return context", async () => {
    const validatedFunction = v.parse(
      validator({ output: v.number("Not a number!") }),
      async () => "123",
    );

    await expectValiIssueMessage(
      () => validatedFunction(),
      "The function does not return the expected output → Not a number!",
    );
  });

  test("treats an explicit empty options object like the default schema", async () => {
    const validatedFunction = v.parse(validator({}), async () => 123);
    await expectValiIssueMessage(
      () => validatedFunction(),
      NO_OUTPUT_MESSAGE_REGEX,
    );
  });
});
