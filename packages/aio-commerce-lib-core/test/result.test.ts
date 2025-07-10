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
import * as Result from "~/lib/result";

describe("aio-commerce-lib-core/result", () => {
  test("should wrap a value in a success result", () => {
    const result = Result.ok("success");
    expect(result).toEqual({ type: "success", value: "success" });

    const value = Result.unwrap(result);
    expect(value).toBe("success");
  });

  test("should wrap an error in a failure result", () => {
    const result = Result.err({ _tag: "Error", message: "error" });
    expect(result).toEqual({
      type: "failure",
      error: { _tag: "Error", message: "error" },
    });

    const error = Result.unwrapErr(result);
    expect(error).toEqual({ _tag: "Error", message: "error" });
  });

  test("should unwrap a success result", () => {
    const result = Result.ok("success");
    const value = Result.unwrap(result);
    expect(value).toBe("success");
  });

  test("should unwrap a failure result", () => {
    const result = Result.err({ _tag: "Error", message: "error" });
    expect(() => Result.unwrap(result)).toThrow();
  });

  test("should check if a result is a success", () => {
    const result = Result.ok("success");
    expect(Result.isOk(result)).toBe(true);
  });

  test("should check if a result is a failure", () => {
    const result = Result.err({ _tag: "Error", message: "error" });
    expect(Result.isErr(result)).toBe(true);
  });

  test("should map a success result", () => {
    const result = Result.ok("success");
    const mapped = Result.map(result, (x) => `${x} mapped`);
    expect(mapped).toEqual({ type: "success", value: "success mapped" });
  });

  test("should not map a failure result", () => {
    const result = Result.err({ _tag: "Error", message: "error" });
    const mapped = Result.map(result, (x) => `${x} mapped`);
    expect(mapped).toEqual({
      type: "failure",
      error: { _tag: "Error", message: "error" },
    });
  });

  test("should map error", () => {
    const result = Result.err({ _tag: "Error", message: "error" });
    const mapped = Result.mapErr(result, (x) => ({
      _tag: "MappedError",
      message: `${x.message} mapped`,
    }));

    expect(mapped).toEqual({
      type: "failure",
      error: { _tag: "MappedError", message: "error mapped" },
    });
  });

  test("should match a success result", () => {
    const result = Result.ok("success");
    const matched = Result.match(result, {
      onSuccess: (x) => `${x} matched on success`,
      onFailure: (x) => `${x} matched on failure`,
    });
    expect(matched).toEqual("success matched on success");
  });

  test("should match a failure result", () => {
    const result = Result.err({ _tag: "Error", message: "error" });
    const matched = Result.match(result, {
      onSuccess: (x) => `${x} matched on success`,
      onFailure: (x) => `${x.message} matched on failure`,
    });

    expect(matched).toEqual("error matched on failure");
  });
});
