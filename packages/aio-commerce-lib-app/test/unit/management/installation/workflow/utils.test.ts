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
  test("should create error from Error instance", () => {
    const err = new Error("Something went wrong");
    const result = createInstallationError(err, ["step", "child"]);
    expect(result).toEqual({
      path: ["step", "child"],
      key: "STEP_EXECUTION_FAILED",
      message: "Something went wrong",
    });
  });

  test("should create error from string", () => {
    const result = createInstallationError("string error", ["a", "b"]);
    expect(result).toEqual({
      path: ["a", "b"],
      key: "STEP_EXECUTION_FAILED",
      message: "string error",
    });
  });

  test("should use custom key when provided", () => {
    const err = new Error("Error message");
    const result = createInstallationError(err, ["path"], "CUSTOM_KEY");
    expect(result).toEqual({
      path: ["path"],
      key: "CUSTOM_KEY",
      message: "Error message",
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
      id: "install-123",
      startedAt: FAKE_SYSTEM_TIME,
      step: mockStep,
      data: { result: "some-data" },
    };

    const result = createSucceededState(base);
    expect(result).toEqual({
      id: "install-123",
      startedAt: FAKE_SYSTEM_TIME,
      step: mockStep,
      data: { result: "some-data" },
      status: "succeeded",
      completedAt: FAKE_SYSTEM_TIME,
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
      id: "install-456",
      startedAt: FAKE_SYSTEM_TIME,
      step: mockStep,
      data: { partial: "data" },
    };
    const error = createMockInstallationError({
      path: ["step", "child"],
      message: "Something failed",
    });

    const result = createFailedState(base, error);
    expect(result).toEqual({
      id: "install-456",
      startedAt: FAKE_SYSTEM_TIME,
      step: mockStep,
      data: { partial: "data" },
      status: "failed",
      completedAt: FAKE_SYSTEM_TIME,
      error,
    });
  });
});
