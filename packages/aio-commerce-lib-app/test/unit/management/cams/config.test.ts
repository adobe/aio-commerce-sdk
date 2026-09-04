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

import { describe, expect, test } from "vitest";

import {
  CAMS_BASE_URL_INPUT,
  DEFAULT_CAMS_BASE_URL,
  resolveCamsBaseUrl,
} from "#management/cams/config";

describe("resolveCamsBaseUrl", () => {
  test("uses the override input when set", () => {
    const url = resolveCamsBaseUrl({
      [CAMS_BASE_URL_INPUT]: "https://cams.stage.example.com",
    });
    expect(url).toBe("https://cams.stage.example.com");
  });

  test("falls back to the production default when unset", () => {
    expect(resolveCamsBaseUrl({})).toBe(DEFAULT_CAMS_BASE_URL);
  });

  test("falls back to the production default when the input is blank", () => {
    expect(resolveCamsBaseUrl({ [CAMS_BASE_URL_INPUT]: "   " })).toBe(
      DEFAULT_CAMS_BASE_URL,
    );
  });

  test("ignores a non-string override", () => {
    expect(resolveCamsBaseUrl({ [CAMS_BASE_URL_INPUT]: 123 })).toBe(
      DEFAULT_CAMS_BASE_URL,
    );
  });
});
