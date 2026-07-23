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

import { actionsError, error, ok, okActions } from "#web/react/result";

describe("result constructors", () => {
  test("creates successful and failed data results", () => {
    const data = { value: "available" };

    expect(ok(data)).toEqual({ data, error: null });
    expect(error("unavailable")).toEqual({
      data: null,
      error: expect.objectContaining({ message: "unavailable" }),
    });
  });

  test("creates successful and failed actions results", () => {
    const actions = { close: async () => undefined };

    expect(okActions(actions)).toEqual({ actions, error: null });
    expect(actionsError("unavailable")).toEqual({
      actions: null,
      error: expect.objectContaining({ message: "unavailable" }),
    });
  });

  test("preserves an error cause", () => {
    const cause = new Error("root cause");

    expect(error("unavailable", { cause }).error.cause).toBe(cause);
    expect(actionsError("unavailable", { cause }).error.cause).toBe(cause);
  });
});
