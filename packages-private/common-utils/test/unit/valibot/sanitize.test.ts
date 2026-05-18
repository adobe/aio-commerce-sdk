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

import { validateMarkdownUrls } from "@aio-commerce-sdk/common-utils/valibot";
import { describe, expect, test } from "vitest";

describe("validateMarkdownUrls", () => {
  test("returns true for plain text", () => {
    expect(validateMarkdownUrls("no links here")).toBe(true);
  });

  test("returns true for https links", () => {
    expect(validateMarkdownUrls("[Docs](https://example.com)")).toBe(true);
  });

  test("returns true for http links", () => {
    expect(validateMarkdownUrls("[Docs](http://example.com)")).toBe(true);
  });

  test("returns false for javascript: links", () => {
    expect(validateMarkdownUrls("[Click](javascript:alert('xss'))")).toBe(
      false,
    );
  });

  test("returns false for data: links", () => {
    expect(validateMarkdownUrls("[x](data:text/html,<h1>hi</h1>)")).toBe(false);
  });

  test("returns false for relative links", () => {
    expect(validateMarkdownUrls("[x](/relative/path)")).toBe(false);
  });

  test("returns false for empty URL in link syntax", () => {
    expect(validateMarkdownUrls("[x]()")).toBe(false);
  });

  test("returns false when any link is unsafe (mixed safe and unsafe)", () => {
    expect(
      validateMarkdownUrls(
        "See [Docs](https://example.com) or [bad](javascript:evil())",
      ),
    ).toBe(false);
  });

  test("returns true for multiple safe links", () => {
    expect(
      validateMarkdownUrls("[A](https://a.com) and [B](http://b.com)"),
    ).toBe(true);
  });

  test("is case-insensitive on scheme", () => {
    expect(validateMarkdownUrls("[x](HTTPS://example.com)")).toBe(true);
    expect(validateMarkdownUrls("[x](Javascript:evil())")).toBe(false);
  });

  test("returns true for empty string", () => {
    expect(validateMarkdownUrls("")).toBe(true);
  });
});
