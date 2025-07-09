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

import { describe, expect, test } from "vitest";
import { err, isErr, isOk, ok, unwrap, unwrapErr } from "~/lib/result";

describe("aio-commerce-lib-core/result", () => {
  test("should wrap a value in a success result", () => {
    const result = ok("success");
    expect(result).toEqual({ type: "success", value: "success" });

    const value = unwrap(result);
    expect(value).toBe("success");
  });

  test("should wrap an error in a failure result", () => {
    const result = err({ _tag: "Error", message: "error" });
    expect(result).toEqual({
      type: "failure",
      error: { _tag: "Error", message: "error" },
    });

    const error = unwrapErr(result);
    expect(error).toEqual({ _tag: "Error", message: "error" });
  });

  test("should unwrap a success result", () => {
    const result = ok("success");
    const value = unwrap(result);
    expect(value).toBe("success");
  });

  test("should unwrap a failure result", () => {
    const result = err({ _tag: "Error", message: "error" });
    expect(() => unwrap(result)).toThrow();
  });

  test("should check if a result is a success", () => {
    const result = ok("success");
    expect(isOk(result)).toBe(true);
  });

  test("should check if a result is a failure", () => {
    const result = err({ _tag: "Error", message: "error" });
    expect(isErr(result)).toBe(true);
  });
});
