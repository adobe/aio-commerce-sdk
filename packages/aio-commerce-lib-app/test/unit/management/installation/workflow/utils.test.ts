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

import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  createFailedState,
  createInstallationError,
  createSucceededState,
  getAtPath,
  nowIsoString,
  setAtPath,
} from "#management/installation/workflow/utils";
import { makeHttpError } from "#test/fixtures/http-error";
import {
  createMockInstallationError,
  createMockStepStatus,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

describe("nowIsoString", () => {
  test("should return a valid ISO date string", () => {
    const result = nowIsoString();
    expect(typeof result).toBe("string");
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).toISOString()).toBe(result);
  });
});

describe("setAtPath", () => {
  test("should set value at a nested path", () => {
    const data: Record<string, unknown> = {};
    setAtPath(data, ["a", "b", "c"], "value");
    expect(data).toEqual({ a: { b: { c: "value" } } });
  });

  test("should set value at a single key path", () => {
    const data: Record<string, unknown> = {};
    setAtPath(data, ["key"], "value");
    expect(data).toEqual({ key: "value" });
  });

  test("should do nothing with empty path", () => {
    const data: Record<string, unknown> = { existing: "data" };
    setAtPath(data, [], "value");
    expect(data).toEqual({ existing: "data" });
  });

  test("should overwrite existing values", () => {
    const data: Record<string, unknown> = { a: { b: "old" } };
    setAtPath(data, ["a", "b"], "new");
    expect(data).toEqual({ a: { b: "new" } });
  });

  test("should create intermediate objects", () => {
    const data: Record<string, unknown> = { a: {} };
    setAtPath(data, ["a", "b", "c"], 123);
    expect(data).toEqual({ a: { b: { c: 123 } } });
  });
});

describe("getAtPath", () => {
  test("should get value at a nested path", () => {
    const data = { a: { b: { c: "value" } } };
    expect(getAtPath(data, ["a", "b", "c"])).toBe("value");
  });

  test("should get value at a single key path", () => {
    const data = { key: "value" };
    expect(getAtPath(data, ["key"])).toBe("value");
  });

  test("should return undefined for missing paths", () => {
    const data = { a: { b: "value" } };
    expect(getAtPath(data, ["a", "c"])).toBeUndefined();
    expect(getAtPath(data, ["x", "y", "z"])).toBeUndefined();
  });

  test("should return undefined when traversing through null", () => {
    const data = { a: null };
    expect(getAtPath(data, ["a", "b"])).toBeUndefined();
  });

  test("should return undefined when traversing through undefined", () => {
    const data: Record<string, unknown> = { a: undefined };
    expect(getAtPath(data, ["a", "b"])).toBeUndefined();
  });

  test("should return the whole object with empty path", () => {
    const data = { a: 1 };
    expect(getAtPath(data, [])).toEqual({ a: 1 });
  });
});

describe("createInstallationError", () => {
  test("should create error from Error instance", async () => {
    const err = new Error("Something went wrong");
    const result = await createInstallationError(err, ["step", "child"]);
    expect(result).toEqual({
      key: "STEP_EXECUTION_FAILED",
      message: "Something went wrong",
      path: ["step", "child"],
    });
  });

  test("should create error from string", async () => {
    const result = await createInstallationError("string error", ["a", "b"]);
    expect(result).toEqual({
      key: "STEP_EXECUTION_FAILED",
      message: "string error",
      path: ["a", "b"],
    });
  });

  test("should use custom key when provided", async () => {
    const err = new Error("Error message");
    const result = await createInstallationError(err, ["path"], "CUSTOM_KEY");
    expect(result).toEqual({
      key: "CUSTOM_KEY",
      message: "Error message",
      path: ["path"],
    });
  });

  test("should unwrap HTTPError response body", async () => {
    const err = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({ message: "API error detail" }),
    );

    const result = await createInstallationError(err, ["step"]);
    expect(result).toEqual({
      key: "STEP_EXECUTION_FAILED",
      message: "HTTP 400 Bad Request — API error detail",
      path: ["step"],
    });
  });
});

describe("createSucceededState", () => {
  const mockStep = createMockStepStatus({ path: [], status: "succeeded" });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  test("should create correct state with status succeeded and completedAt", () => {
    const base = {
      data: { result: "some-data" },
      id: "install-123",
      startedAt: FAKE_SYSTEM_TIME,
      step: mockStep,
    };

    const result = createSucceededState(base);
    expect(result).toEqual({
      completedAt: FAKE_SYSTEM_TIME,
      data: { result: "some-data" },
      id: "install-123",
      startedAt: FAKE_SYSTEM_TIME,
      status: "succeeded",
      step: mockStep,
    });
  });
});

describe("createFailedState", () => {
  const mockStep = createMockStepStatus({ path: [], status: "failed" });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  test("should create correct state with status failed, completedAt, and error", () => {
    const base = {
      data: { partial: "data" },
      id: "install-456",
      startedAt: FAKE_SYSTEM_TIME,
      step: mockStep,
    };
    const error = createMockInstallationError({
      message: "Something failed",
      path: ["step", "child"],
    });

    const result = createFailedState(base, error);
    expect(result).toEqual({
      completedAt: FAKE_SYSTEM_TIME,
      data: { partial: "data" },
      error,
      id: "install-456",
      startedAt: FAKE_SYSTEM_TIME,
      status: "failed",
      step: mockStep,
    });
  });
});
