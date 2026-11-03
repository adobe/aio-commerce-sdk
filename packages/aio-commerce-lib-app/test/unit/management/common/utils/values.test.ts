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

import { fieldValuesEqual, isUnset } from "#management/common/utils/values";

describe("fieldValuesEqual", () => {
  test("compares arrays regardless of element and key order", () => {
    expect(
      fieldValuesEqual([{ a: 1, b: 2 }, { c: 3 }], [{ c: 3 }, { a: 1, b: 2 }]),
    ).toBe(true);
  });

  test("treats a missing array and an empty array as equal", () => {
    expect(fieldValuesEqual(undefined, [])).toBe(true);
  });

  test("tells arrays with different elements apart", () => {
    expect(fieldValuesEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
  });

  test("compares other values strictly", () => {
    expect(fieldValuesEqual(1, 1)).toBe(true);
    expect(fieldValuesEqual(false, undefined)).toBe(false);
  });
});

describe("isUnset", () => {
  test("is true for undefined and an empty array only", () => {
    expect(isUnset(undefined)).toBe(true);
    expect(isUnset([])).toBe(true);
    expect(isUnset(false)).toBe(false);
    expect(isUnset([1])).toBe(false);
  });
});
