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

import { sanitizeMarkdownUrls } from "@aio-commerce-sdk/common-utils/valibot";
import { describe, expect, test } from "vitest";

describe("sanitizeMarkdownUrls", () => {
  test("returns plain text unchanged", () => {
    expect(sanitizeMarkdownUrls("no links here")).toBe("no links here");
  });
  test("keeps https links", () => {
    expect(sanitizeMarkdownUrls("[Docs](https://example.com)")).toBe(
      "[Docs](https://example.com)",
    );
  });
  test("keeps http links", () => {
    expect(sanitizeMarkdownUrls("[Docs](http://example.com)")).toBe(
      "[Docs](http://example.com)",
    );
  });
  test("strips javascript: links", () => {
    expect(sanitizeMarkdownUrls("[Click](javascript:alert('xss'))")).toBe(
      "[Click]()",
    );
  });
  test("strips data: links", () => {
    expect(sanitizeMarkdownUrls("[x](data:text/html,<h1>hi</h1>)")).toBe(
      "[x]()",
    );
  });
  test("strips relative links", () => {
    expect(sanitizeMarkdownUrls("[x](/relative/path)")).toBe("[x]()");
  });
  test("handles multiple links — strips only unsafe ones", () => {
    expect(
      sanitizeMarkdownUrls(
        "See [Docs](https://example.com) or [bad](javascript:evil()) for more",
      ),
    ).toBe("See [Docs](https://example.com) or [bad]() for more");
  });
  test("is case-insensitive on scheme", () => {
    expect(sanitizeMarkdownUrls("[x](HTTPS://example.com)")).toBe(
      "[x](HTTPS://example.com)",
    );
    expect(sanitizeMarkdownUrls("[x](Javascript:evil())")).toBe("[x]()");
  });
  test("returns empty string unchanged", () => {
    expect(sanitizeMarkdownUrls("")).toBe("");
  });
});
