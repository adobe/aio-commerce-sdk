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

import { stringify } from "safe-stable-stringify";

/** True when two optional arrays contain the same elements, regardless of order. Treats `undefined` and `[]` as equal. */
function arraysEqualUnordered(
  a: unknown[] | undefined,
  b: unknown[] | undefined,
): boolean {
  // `stringify` sorts object keys, so equal elements serialize identically regardless of key order.
  const normalizedA = (a ?? []).map((item) => stringify(item) ?? "").sort();
  const normalizedB = (b ?? []).map((item) => stringify(item) ?? "").sort();
  return (
    normalizedA.length === normalizedB.length &&
    normalizedA.every((value, index) => value === normalizedB[index])
  );
}

/** True when two field values are equal. Arrays compare regardless of order. */
export function fieldValuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return arraysEqualUnordered(
      a as unknown[] | undefined,
      b as unknown[] | undefined,
    );
  }

  return a === b;
}

/** True when a field value counts as unset: absent, or an empty array. */
export function isUnset(value: unknown): boolean {
  const isEmptyArray = Array.isArray(value) && value.length === 0;
  return value === undefined || isEmptyArray;
}
