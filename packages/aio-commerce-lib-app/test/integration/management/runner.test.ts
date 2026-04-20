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

import {
  createInitialInstallationState,
  runInstallation,
  runValidation,
} from "#management/installation/runner";
import {
  isFailedState,
  isSucceededState,
} from "#management/installation/workflow/types";
import {
  configWithCustomInstallationSteps,
  configWithOneScript,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockInstallationContext,
  createMockInstallationContextWithScripts,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";

type StepStatusNode = {
  name: string;
  path: string[];
  status: string;
  children: StepStatusNode[];
};

function findStepStatusByPath(
  step: StepStatusNode,
  expectedPath: string[],
): StepStatusNode | undefined {
  if (step.path.join(".") === expectedPath.join(".")) {
    return step;
  }

  for (const child of step.children) {
    const found = findStepStatusByPath(child, expectedPath);
    if (found) {
      return found;
    }
  }

  return;
}

describe("createInitialInstallationState", () => {
  test("minimal config only includes the installation root", () => {
    const state = createInitialInstallationState({
      config: minimalValidConfig,
    });

    expect(state.status).toBe("in-progress");
    expect(state.step.name).toBe("installation");
    expect(state.step.path).toEqual(["installation"]);
    expect(state.step.children).toHaveLength(0);
  });

  test("custom installation config includes the generated script steps", () => {
    const state = createInitialInstallationState({
      config: configWithCustomInstallationSteps,
    });

    expect(state.step.children).toHaveLength(1);

    const customBranch = state.step.children[0];
    expect(customBranch.name).toBe("customInstallationSteps");
    expect(customBranch.path).toEqual([
      "installation",
      "customInstallationSteps",
    ]);
    expect(customBranch.children.map((child) => child.name)).toEqual([
      "demoSuccess",
      "demoError",
    ]);
  });
});

describe("runInstallation - minimal config", () => {
  test("returns a succeeded state and preserves the initial state id", async () => {
    const config = minimalValidConfig;
    const initialState = createInitialInstallationState({ config });

    const result = await runInstallation({
      config,
      installationContext: createMockInstallationContext(),
      initialState,
    });

    expect(isSucceededState(result)).toBe(true);
    expect(result.status).toBe("succeeded");
    expect(result.id).toBe(initialState.id);
    expect(result.completedAt).toBeDefined();
    expect(new Date(result.startedAt) <= new Date(result.completedAt)).toBe(
      true,
    );
  });
});

describe("runInstallation - custom installation scripts", () => {
  test("stores successful script output at the script step path", async () => {
    const config = configWithOneScript;
    const scriptOutput = { payload: "done" };
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": { default: vi.fn().mockResolvedValue(scriptOutput) },
    });

    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      installationContext,
      initialState,
    });

    expect(isSucceededState(result)).toBe(true);
    expect(result.data).toMatchObject({
      installation: {
        customInstallationSteps: {
          myScript: {
            script: "./my-script.js",
            data: scriptOutput,
          },
        },
      },
    });
  });

  test("returns a failed state when the script is missing from the execution context", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({});
    const initialState = createInitialInstallationState({ config });

    const result = await runInstallation({
      config,
      installationContext,
      initialState,
    });

    expect.assert(isFailedState(result));
    expect(result.error.path).toEqual([
      "installation",
      "customInstallationSteps",
      "myScript",
    ]);
    expect(result.error.message).toContain(
      "not found in customScripts context",
    );
  });

  test("returns a failed state with the script path when the script throws", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": {
        default: vi.fn().mockRejectedValue(new Error("script exploded")),
      },
    });

    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      installationContext,
      initialState,
    });

    expect.assert(isFailedState(result));
    expect(result.error.message).toContain("script exploded");
    expect(result.error.path).toEqual([
      "installation",
      "customInstallationSteps",
      "myScript",
    ]);
  });

  test("marks the failing script step as failed in the final state tree", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": {
        default: vi.fn().mockRejectedValue(new Error("boom")),
      },
    });

    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      installationContext,
      initialState,
    });

    const leafStatus = findStepStatusByPath(result.step as StepStatusNode, [
      "installation",
      "customInstallationSteps",
      "myScript",
    ]);

    expect(leafStatus?.name).toBe("myScript");
    expect(leafStatus?.status).toBe("failed");
  });

  test("stops executing later scripts after the first failure", async () => {
    const config = configWithCustomInstallationSteps;
    const secondScript = vi.fn().mockResolvedValue({});
    const installationContext = createMockInstallationContextWithScripts({
      "./demo-success.js": {
        default: vi.fn().mockRejectedValue(new Error("first fails")),
      },
      "./demo-error.js": { default: secondScript },
    });

    const initialState = createInitialInstallationState({ config });
    await runInstallation({ config, installationContext, initialState });

    expect(secondScript).not.toHaveBeenCalled();
  });

  test("returns a failed state when the script default export is not a function", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": { default: "not-a-function" },
    });

    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      installationContext,
      initialState,
    });

    expect.assert(isFailedState(result));
    expect(result.error.message).toContain("default export must be a function");
  });
});

describe("runInstallation - lifecycle hooks", () => {
  test("fires onInstallationStart before the first step starts", async () => {
    const order: string[] = [];
    const config = minimalValidConfig;
    const initialState = createInitialInstallationState({ config });

    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(() => {
        order.push("start");
      }),
      onStepStart: vi.fn(() => {
        order.push("stepStart");
      }),
    };

    await runInstallation({
      config,
      installationContext: createMockInstallationContext(),
      initialState,
      hooks,
    });

    expect(order.slice(0, 2)).toEqual(["start", "stepStart"]);
  });

  test("fires onInstallationFailure instead of onInstallationSuccess when a step fails", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({});
    const initialState = createInitialInstallationState({ config });
    const onInstallationSuccess = vi.fn();
    const onInstallationFailure = vi.fn();

    await runInstallation({
      config,
      installationContext,
      initialState,
      hooks: { onInstallationSuccess, onInstallationFailure },
    });

    expect(onInstallationSuccess).not.toHaveBeenCalled();
    expect(onInstallationFailure).toHaveBeenCalledOnce();
    expect(onInstallationFailure.mock.calls[0]?.[0]).toMatchObject({
      status: "failed",
    });
  });

  test("fires step start and success hooks for each active installation step", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": { default: vi.fn().mockResolvedValue(null) },
    });

    const initialState = createInitialInstallationState({ config });
    const onStepStart = vi.fn();
    const onStepSuccess = vi.fn();

    await runInstallation({
      config,
      installationContext,
      initialState,
      hooks: { onStepStart, onStepSuccess },
    });

    const startedPaths = onStepStart.mock.calls.map(
      (args: unknown[]) => (args[0] as { path: string[] }).path,
    );
    const succeededPaths = onStepSuccess.mock.calls.map(
      (args: unknown[]) => (args[0] as { path: string[] }).path,
    );

    const expectedPaths = [
      ["installation"],
      ["installation", "customInstallationSteps"],
      ["installation", "customInstallationSteps", "myScript"],
    ];

    expect(startedPaths).toEqual(expect.arrayContaining(expectedPaths));
    expect(succeededPaths).toEqual(expect.arrayContaining(expectedPaths));
  });

  test("fires step failure hooks for the failing script and its ancestor branches", async () => {
    const config = configWithOneScript;
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": {
        default: vi.fn().mockRejectedValue(new Error("leaf failure")),
      },
    });

    const initialState = createInitialInstallationState({ config });
    const onStepFailure = vi.fn();

    await runInstallation({
      config,
      installationContext,
      initialState,
      hooks: { onStepFailure },
    });

    const failedPaths = onStepFailure.mock.calls.map(
      (args: unknown[]) => (args[0] as { path: string[] }).path,
    );

    expect(failedPaths).toEqual(
      expect.arrayContaining([
        ["installation"],
        ["installation", "customInstallationSteps"],
        ["installation", "customInstallationSteps", "myScript"],
      ]),
    );
    expect(onStepFailure.mock.calls[0]?.[0]).toMatchObject({
      error: expect.objectContaining({
        message: expect.stringContaining("leaf failure"),
      }),
    });
  });
});

describe("runValidation", () => {
  test("returns a valid result with no issues for the minimal config", async () => {
    const config = minimalValidConfig;
    const validationContext = createMockInstallationContext();

    const result = await runValidation({ config, validationContext });

    expect(result.valid).toBe(true);
    expect(result.summary).toEqual({
      errors: 0,
      warnings: 0,
      totalIssues: 0,
    });
  });
});
