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

import { expectValiIssueMessage } from "#test/utils/assertions";
import { withPrefixedMessage } from "#valibot/messages";

const INVALID_INPUT_MESSAGE_REGEX = /^Invalid input/;

describe("withPrefixedMessage", () => {
  test("prefixes an explicit schema message", async () => {
    const schema = withPrefixedMessage(
      v.string("Expected a plain string"),
      "Invalid input",
    );

    await expectValiIssueMessage(
      () => v.parse(schema, 123),
      "Invalid input → Expected a plain string",
    );
  });

  test("prefixes the default Valibot message", async () => {
    const schema = withPrefixedMessage(v.number(), "Invalid input");

    await expectValiIssueMessage(
      () => v.parse(schema, "abc"),
      INVALID_INPUT_MESSAGE_REGEX,
    );
  });

  test("supports a custom separator", async () => {
    const schema = withPrefixedMessage(
      v.string("Expected a plain string"),
      "Invalid input",
      " ->",
    );

    await expectValiIssueMessage(
      () => v.parse(schema, 123),
      "Invalid input -> Expected a plain string",
    );
  });

  test("supports an empty separator", async () => {
    const schema = withPrefixedMessage(
      v.string("Expected a plain string"),
      "Invalid input",
      "",
    );

    await expectValiIssueMessage(
      () => v.parse(schema, 123),
      "Invalid inputExpected a plain string",
    );
  });

  test("does not add an extra space when the separator already ends with one", async () => {
    const schema = withPrefixedMessage(
      v.string("Expected a plain string"),
      "Invalid input",
      " -> ",
    );

    await expectValiIssueMessage(
      () => v.parse(schema, 123),
      "Invalid input -> Expected a plain string",
    );
  });

  test("prefixes nested subissues", () => {
    const schema = withPrefixedMessage(
      v.union([
        v.string("Expected a plain string"),
        v.number("Expected a plain number"),
      ]),
      "Invalid input",
    );

    const result = v.safeParse(schema, true);

    expect(result.issues).toBeDefined();
    expect(result.issues?.[0]?.message).toMatch(INVALID_INPUT_MESSAGE_REGEX);
    expect(result.issues?.[0]?.issues).toHaveLength(2);
    expect(result.issues?.[0]?.issues?.[0]?.message).toBe(
      "Invalid input → Expected a plain string",
    );
    expect(result.issues?.[0]?.issues?.[1]?.message).toBe(
      "Invalid input → Expected a plain number",
    );
  });
});
