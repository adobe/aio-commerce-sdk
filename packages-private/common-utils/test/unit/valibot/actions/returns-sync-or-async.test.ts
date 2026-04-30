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

import { returnsSyncOrAsync } from "#valibot/actions/returns-sync-or-async";

describe("returnsSyncOrAsync", () => {
  test("treats null as a synchronous non-promise-like return value", () => {
    const schema = v.pipe(v.function(), returnsSyncOrAsync(v.null()));
    const validatedFunction = v.parse(schema, () => null);

    expect(validatedFunction()).toBeNull();
  });

  test("treats plain synchronous return values as synchronous", () => {
    const schema = v.pipe(v.function(), returnsSyncOrAsync(v.number()));
    const validatedFunction = v.parse(schema, () => 123);

    expect(validatedFunction()).toBe(123);
  });

  test("treats Promise return values as asynchronous", async () => {
    const schema = v.pipe(v.function(), returnsSyncOrAsync(v.number()));
    const validatedFunction = v.parse(schema, () => Promise.resolve(123));

    await expect(validatedFunction()).resolves.toBe(123);
  });
});
