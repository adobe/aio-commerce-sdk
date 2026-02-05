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

import { describe, expect, test, vi } from "vitest";

import { callHook } from "#management/installation/workflow/hooks";
import { createMockInProgressState } from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";

/** Creates a mock step event for testing. */
function createMockStepEvent() {
  return {
    path: ["root", "child"],
    stepName: "child",
    isLeaf: true,
  };
}

describe("callHook", () => {
  test("should call sync hook with correct arguments", async () => {
    const mockHook = vi.fn();
    const hooks: InstallationHooks = { onInstallationStart: mockHook };
    const state = createMockInProgressState();

    await callHook(hooks, "onInstallationStart", state);

    expect(mockHook).toHaveBeenCalledOnce();
    expect(mockHook).toHaveBeenCalledWith(state);
  });

  test("should await async hook and resolve", async () => {
    const mockHook = vi.fn().mockResolvedValue(undefined);
    const hooks: InstallationHooks = { onInstallationStart: mockHook };
    const state = createMockInProgressState();

    await expect(
      callHook(hooks, "onInstallationStart", state),
    ).resolves.toBeUndefined();
    expect(mockHook).toHaveBeenCalledOnce();
  });

  test("should not throw when hook is undefined", async () => {
    const hooks: InstallationHooks = {};
    const state = createMockInProgressState();

    await expect(
      callHook(hooks, "onInstallationStart", state),
    ).resolves.toBeUndefined();
  });

  test("should not throw when hooks object is undefined", async () => {
    const state = createMockInProgressState();
    await expect(
      callHook(undefined, "onInstallationStart", state),
    ).resolves.toBeUndefined();
  });

  describe("installation hooks (state only)", () => {
    test.each([
      "onInstallationStart",
      "onInstallationSuccess",
      "onInstallationFailure",
    ] as const)("%s should receive the state", async (hookName) => {
      const mockHook = vi.fn();
      const hooks: InstallationHooks = { [hookName]: mockHook };
      const state = createMockInProgressState();

      await callHook(hooks, hookName, state);

      expect(mockHook).toHaveBeenCalledOnce();
      expect(mockHook).toHaveBeenCalledWith(state);
    });
  });

  describe("step hooks (event and state)", () => {
    test.each([
      { hookName: "onStepStart" as const, extraProps: {} },
      {
        hookName: "onStepSuccess" as const,
        extraProps: { result: { success: true } },
      },
      {
        hookName: "onStepFailure" as const,
        extraProps: {
          error: {
            path: ["root", "child"],
            key: "STEP_EXECUTION_FAILED",
            message: "Something went wrong",
          },
        },
      },
    ])("$hookName should receive event and state", async ({
      hookName,
      extraProps,
    }) => {
      const mockHook = vi.fn();
      const hooks: InstallationHooks = { [hookName]: mockHook };
      const state = createMockInProgressState();
      const event = { ...createMockStepEvent(), ...extraProps };

      await callHook(hooks, hookName, event, state);

      expect(mockHook).toHaveBeenCalledOnce();
      expect(mockHook).toHaveBeenCalledWith(event, state);
    });
  });
});
