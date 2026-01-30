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
  isCompletedState,
  isFailedState,
  isInProgressState,
  isPendingState,
  isSucceededState,
} from "#management/installation/workflow/types";
import {
  createMockFailedState,
  createMockInProgressState,
  createMockPendingState,
  createMockSucceededState,
} from "#test/fixtures/installation";

const pendingState = createMockPendingState();
const inProgressState = createMockInProgressState();
const succeededState = createMockSucceededState();
const failedState = createMockFailedState();

describe("isPendingState", () => {
  test("returns true for pending state", () => {
    expect(isPendingState(pendingState)).toBe(true);
  });

  test.each([
    { name: "in-progress", state: inProgressState },
    { name: "succeeded", state: succeededState },
    { name: "failed", state: failedState },
  ])("returns false for $name state", ({ state }) => {
    expect(isPendingState(state)).toBe(false);
  });
});

describe("isInProgressState", () => {
  test("returns true for in-progress state", () => {
    expect(isInProgressState(inProgressState)).toBe(true);
  });

  test.each([
    { name: "pending", state: pendingState },
    { name: "succeeded", state: succeededState },
    { name: "failed", state: failedState },
  ])("returns false for $name state", ({ state }) => {
    expect(isInProgressState(state)).toBe(false);
  });
});

describe("isSucceededState", () => {
  test("returns true for succeeded state", () => {
    expect(isSucceededState(succeededState)).toBe(true);
  });

  test.each([
    { name: "pending", state: pendingState },
    { name: "in-progress", state: inProgressState },
    { name: "failed", state: failedState },
  ])("returns false for $name state", ({ state }) => {
    expect(isSucceededState(state)).toBe(false);
  });
});

describe("isFailedState", () => {
  test("returns true for failed state", () => {
    expect(isFailedState(failedState)).toBe(true);
  });

  test.each([
    { name: "pending", state: pendingState },
    { name: "in-progress", state: inProgressState },
    { name: "succeeded", state: succeededState },
  ])("returns false for $name state", ({ state }) => {
    expect(isFailedState(state)).toBe(false);
  });
});

describe("isCompletedState", () => {
  test.each([
    { name: "succeeded", state: succeededState },
    { name: "failed", state: failedState },
  ])("returns true for $name state", ({ state }) => {
    expect(isCompletedState(state)).toBe(true);
  });

  test.each([
    { name: "pending", state: pendingState },
    { name: "in-progress", state: inProgressState },
  ])("returns false for $name state", ({ state }) => {
    expect(isCompletedState(state)).toBe(false);
  });
});
