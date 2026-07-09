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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createInitialState,
  createRetryState,
  executeUninstallWorkflow,
  executeWorkflow,
} from "#management/installation/workflow/runner";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockFailedState,
  createMockInstallationContext,
  createMockStepStatus,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";

describe("createInitialState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should create initial state with unique id and in-progress status", () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const state = createInitialState({ config: minimalValidConfig, rootStep });

    expect(state.id).toBeDefined();
    expect(typeof state.id).toBe("string");
    expect(state.id.length).toBeGreaterThan(0);
    expect(state.status).toBe("in-progress");
  });

  test("should persist the validated config on the state", () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const state = createInitialState({ config: minimalValidConfig, rootStep });

    expect(state.config).toEqual(minimalValidConfig);
  });

  test("should default data to null", () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const state = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    expect(state.data).toBeNull();
  });

  test("should build step status from root step with name and meta", () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: {
        install: { description: "Main installation", label: "Installation" },
      },
      name: "installation",
    });

    const state = createInitialState({ config: minimalValidConfig, rootStep });

    expect(state.step.name).toBe("installation");
    expect(state.step.meta).toEqual({
      description: "Main installation",
      label: "Installation",
    });
    expect(state.step.status).toBe("pending");
  });

  test("should filter children based on when conditions (include steps where when returns true)", () => {
    const includedStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Included" } },
      name: "included",

      // @ts-expect-error It's for testing
      when: () => true,
    });

    const excludedStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Excluded" } },
      name: "excluded",

      // @ts-expect-error It's for testing
      when: () => false,
    });

    const rootStep = defineBranchStep({
      children: [includedStep, excludedStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const state = createInitialState({ config: minimalValidConfig, rootStep });
    expect(state.step.children).toHaveLength(1);
    expect(state.step.children[0].name).toBe("included");
  });

  test("should recursively build children for branch steps", () => {
    const grandchildStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Grandchild" } },
      name: "grandchild",
    });

    const childBranch = defineBranchStep({
      children: [grandchildStep],
      meta: { install: { label: "Child Branch" } },
      name: "child-branch",
    });

    const rootStep = defineBranchStep({
      children: [childBranch],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const state = createInitialState({ config: minimalValidConfig, rootStep });
    expect(state.step.children).toHaveLength(1);
    expect(state.step.children[0].name).toBe("child-branch");
    expect(state.step.children[0].children).toHaveLength(1);
    expect(state.step.children[0].children[0].name).toBe("grandchild");
  });

  test("should handle leaf steps (no children)", () => {
    const leafStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Leaf" } },
      name: "leaf",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const state = createInitialState({ config: minimalValidConfig, rootStep });

    expect(state.step.children).toHaveLength(1);
    expect(state.step.children[0].name).toBe("leaf");
    expect(state.step.children[0].children).toEqual([]);
  });

  test("should use uninstallMeta for steps when mode is 'uninstall'", () => {
    const childStep = defineLeafStep({
      install: vi.fn(),
      meta: {
        install: { description: "Installs something", label: "Install Child" },
        uninstall: {
          description: "Removes something",
          label: "Uninstall Child",
        },
      },
      name: "child",
    });

    const rootStep = defineBranchStep({
      children: [childStep],
      meta: {
        install: { label: "Installation" },
        uninstall: { label: "Uninstallation" },
      },
      name: "root",
    });

    const state = createInitialState({
      config: minimalValidConfig,
      mode: "uninstall",
      rootStep,
    });

    expect(state.step.meta).toEqual({ label: "Uninstallation" });
    expect(state.step.children[0].meta).toEqual({
      description: "Removes something",
      label: "Uninstall Child",
    });
  });

  test("should fall back to meta when uninstallMeta is absent and mode is 'uninstall'", () => {
    const childStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Install Child" } },
      name: "child",
    });

    const rootStep = defineBranchStep({
      children: [childStep],
      meta: { install: { label: "Installation" } },
      name: "root",
    });

    const state = createInitialState({
      config: minimalValidConfig,
      mode: "uninstall",
      rootStep,
    });

    expect(state.step.meta).toEqual({ label: "Installation" });
    expect(state.step.children[0].meta).toEqual({ label: "Install Child" });
  });
});

describe("executeWorkflow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should return succeeded state when all steps complete successfully", async () => {
    const leafStep = defineLeafStep({
      install: () => "result",
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("succeeded");
    expect(result.id).toBe(initialState.id);
  });

  test("should fall back to INSTALLATION_FAILED when a success hook throws after execution completes", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeWorkflow({
      config: minimalValidConfig,
      hooks: {
        onInstallationSuccess: () => {
          throw new Error("hook failed");
        },
      },
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error.key).toBe("INSTALLATION_FAILED");
      expect(result.error.path).toEqual([]);
      expect(result.error.message).toBe("hook failed");
    }
  });

  test("should return failed state when a step throws an error", async () => {
    const failingStep = defineLeafStep({
      install: () => {
        throw new Error("Step failed");
      },
      meta: { install: { label: "Failing Step" } },
      name: "failing",
    });

    const rootStep = defineBranchStep({
      children: [failingStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Step failed");
    }
  });

  test("should call onInstallationStart hook at the beginning", async () => {
    const leafStep = defineLeafStep({
      install: () => "result",
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    await executeWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationStart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: initialState.id,
        status: "in-progress",
      }),
    );
  });

  test("should call onInstallationSuccess hook on success", async () => {
    const leafStep = defineLeafStep({
      install: () => "result",
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onInstallationSuccess: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    await executeWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        id: initialState.id,
        status: "succeeded",
      }),
    );
  });

  test("should call onInstallationFailure hook on failure", async () => {
    const failingStep = defineLeafStep({
      install: () => {
        throw new Error("Failure");
      },
      meta: { install: { label: "Failing" } },
      name: "failing",
    });

    const rootStep = defineBranchStep({
      children: [failingStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onInstallationFailure: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    await executeWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(hooks.onInstallationFailure).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Failure",
        }),
        id: initialState.id,
        status: "failed",
      }),
    );
  });

  test("should call onStepStart, onStepSuccess for each step", async () => {
    const leafStep = defineLeafStep({
      install: () => "result",
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    await executeWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    // Called for root and step1
    expect(hooks.onStepStart).toHaveBeenCalledTimes(2);
    expect(hooks.onStepSuccess).toHaveBeenCalledTimes(2);

    // Verify step1 was called
    expect(hooks.onStepStart).toHaveBeenCalledWith(
      expect.objectContaining({ isLeaf: true, stepName: "step1" }),
      expect.any(Object),
    );

    expect(hooks.onStepSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ isLeaf: true, stepName: "step1" }),
      expect.any(Object),
    );
  });

  test("should call onStepFailure when a step fails", async () => {
    const failingStep = defineLeafStep({
      install: () => {
        throw new Error("Step error");
      },
      meta: { install: { label: "Failing" } },
      name: "failing",
    });

    const rootStep = defineBranchStep({
      children: [failingStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onStepFailure: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    await executeWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    // Called for failing step and root (which also fails due to child failure)
    expect(hooks.onStepFailure).toHaveBeenCalledTimes(2);
    expect(hooks.onStepFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: "Step error" }),
        isLeaf: true,
        stepName: "failing",
      }),
      expect.any(Object),
    );
  });

  test("should execute leaf step run functions with config and context", async () => {
    const installFn = vi.fn().mockReturnValue("result");
    const leafStep = defineLeafStep({
      install: installFn,
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const installationContext = createMockInstallationContext();
    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext,
      rootStep,
    });

    expect(installFn).toHaveBeenCalledTimes(1);
    expect(installFn).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({
        logger: installationContext.logger,
        params: installationContext.params,
      }),
    );
  });

  test("should store leaf step results in data at the correct path", async () => {
    const leafStep = defineLeafStep({
      install: () => ({ key: "value" }),
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    // Path is ["root", "step1"], so data should be { root: { step1: { key: "value" } } }
    expect(result.data).toEqual({
      root: {
        step1: { key: "value" },
      },
    });
  });

  test("should execute branch step children in order", async () => {
    const executionOrder: string[] = [];

    const step1 = defineLeafStep({
      install: () => {
        executionOrder.push("step1");
        return "result1";
      },
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const step2 = defineLeafStep({
      install: () => {
        executionOrder.push("step2");
        return "result2";
      },
      meta: { install: { label: "Step 2" } },
      name: "step2",
    });

    const step3 = defineLeafStep({
      install: () => {
        executionOrder.push("step3");
        return "result3";
      },
      meta: { install: { label: "Step 3" } },
      name: "step3",
    });

    const rootStep = defineBranchStep({
      children: [step1, step2, step3],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(executionOrder).toEqual(["step1", "step2", "step3"]);
  });

  test("should return a failed state when the initial state references a child step missing from the definition", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    initialState.step.children.push({
      children: [],
      id: "missing-child-id",
      meta: { label: "Missing Child" },
      name: "missing-child",
      path: ["root", "missing-child"],
      status: "pending",
    });

    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error.message).toBe('Step "missing-child" not found');
    }
  });

  test("should tolerate a malformed step object that is neither branch nor leaf", async () => {
    const rootStep = defineBranchStep({
      children: [],
      meta: { install: { label: "Root" } },
      name: "root",
    });
    Reflect.set(rootStep, "type", "unknown");

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("succeeded");
    expect(result.step.status).toBe("succeeded");
  });
});

describe("executeUninstallWorkflow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should call uninstall handler on steps that have one", async () => {
    const uninstallFn = vi.fn();
    const leafStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Step 1" } },
      name: "step1",
      uninstall: uninstallFn,
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const installationContext = createMockInstallationContext();
    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeUninstallWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext,
      rootStep,
    });

    expect(result.status).toBe("succeeded");
    expect(uninstallFn).toHaveBeenCalledTimes(1);
    expect(uninstallFn).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({
        logger: installationContext.logger,
        params: installationContext.params,
      }),
    );
  });

  test("should silently skip steps that do not have an uninstall handler", async () => {
    const installFn = vi.fn().mockReturnValue("result");
    const leafStep = defineLeafStep({
      install: installFn,
      meta: { install: { label: "Step 1" } },
      name: "step1",
      // no uninstall handler
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeUninstallWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    // Step should succeed even without an uninstall handler
    expect(result.status).toBe("succeeded");
    // The install function should NOT be called during uninstall
    expect(installFn).not.toHaveBeenCalled();
  });

  test("should return failed state when an uninstall handler throws", async () => {
    const leafStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Step 1" } },
      name: "step1",
      uninstall: () => {
        throw new Error("Uninstall failed");
      },
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeUninstallWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Uninstall failed");
    }
  });

  test("should call lifecycle hooks the same way as executeWorkflow", async () => {
    const leafStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Step 1" } },
      name: "step1",
      uninstall: vi.fn(),
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
      onInstallationSuccess: vi.fn(),
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    await executeUninstallWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    // Called for root and step1
    expect(hooks.onStepStart).toHaveBeenCalledTimes(2);
    expect(hooks.onStepSuccess).toHaveBeenCalledTimes(2);
  });

  test("should not store step results in data during uninstall", async () => {
    const leafStep = defineLeafStep({
      install: vi.fn().mockReturnValue({ key: "value" }),
      meta: { install: { label: "Step 1" } },
      name: "step1",
      uninstall: vi.fn(),
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeUninstallWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    // No step results stored during uninstall (uninstall returns void, not keyed data)
    expect(result.status).toBe("succeeded");
    // data may be initialized to an empty object, but no step results are nested in it
    expect(result.data).not.toHaveProperty("root.step1");
  });

  test("should call onInstallationFailure hook when uninstall handler throws", async () => {
    const leafStep = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Step 1" } },
      name: "step1",
      uninstall: () => {
        throw new Error("Uninstall error");
      },
    });

    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const hooks: InstallationHooks = {
      onInstallationFailure: vi.fn(),
    };

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    await executeUninstallWorkflow({
      config: minimalValidConfig,
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(hooks.onInstallationFailure).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Uninstall error",
        }),
        id: initialState.id,
        status: "failed",
      }),
    );
  });

  test("should handle mixed scenario — some steps have uninstall, some do not", async () => {
    const uninstallFn = vi.fn();
    const installFn2 = vi.fn().mockReturnValue("result2");

    const step1 = defineLeafStep({
      install: vi.fn(),
      meta: { install: { label: "Step 1" } },
      name: "step1",
      uninstall: uninstallFn,
    });

    const step2 = defineLeafStep({
      install: installFn2,
      meta: { install: { label: "Step 2" } },
      name: "step2",
      // no uninstall handler
    });

    const rootStep = defineBranchStep({
      children: [step1, step2],
      meta: { install: { label: "Root" } },
      name: "root",
    });

    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });

    const result = await executeUninstallWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    // step1's uninstall should be called
    expect(uninstallFn).toHaveBeenCalledTimes(1);
    // step2 should be silently skipped, install should not be called
    expect(installFn2).not.toHaveBeenCalled();
    // Overall workflow result should be succeeded
    expect(result.status).toBe("succeeded");
  });
});

describe("createRetryState", () => {
  test("should preserve id and startedAt from failed state", () => {
    const failedState = createMockFailedState({
      id: "install-abc",
      startedAt: FAKE_SYSTEM_TIME,
    });

    const retryState = createRetryState(failedState);

    expect(retryState.id).toBe("install-abc");
    expect(retryState.startedAt).toBe(FAKE_SYSTEM_TIME);
    expect(retryState.status).toBe("in-progress");
  });

  test("should preserve succeeded child statuses and reset failed child to pending", () => {
    const failedState = createMockFailedState({
      step: createMockStepStatus({
        children: [
          createMockStepStatus({
            name: "step-a",
            path: ["installation", "step-a"],
            status: "succeeded",
          }),
          createMockStepStatus({
            name: "step-b",
            path: ["installation", "step-b"],
            status: "failed",
          }),
        ],
        status: "failed",
      }),
    });

    const retryState = createRetryState(failedState);

    expect(retryState.step.children[0].status).toBe("succeeded");
    expect(retryState.step.children[1].status).toBe("pending");
  });

  test("should reset root step to pending when it was failed", () => {
    const failedState = createMockFailedState({
      step: createMockStepStatus({ children: [], status: "failed" }),
    });

    const retryState = createRetryState(failedState);

    expect(retryState.step.status).toBe("pending");
  });

  test("should carry over data from the failed state", () => {
    const partialData = { installation: { "step-a": { id: "123" } } };
    const failedState = createMockFailedState({ data: partialData });

    const retryState = createRetryState(failedState);

    expect(retryState.data).toBe(partialData);
  });

  test("should carry over the config from the failed state", () => {
    const failedState = createMockFailedState({ config: minimalValidConfig });

    const retryState = createRetryState(failedState);

    expect(retryState.config).toEqual(minimalValidConfig);
  });
});

describe("executeWorkflow — skip already-succeeded steps", () => {
  test("should skip leaf steps with status succeeded in initial state", async () => {
    const install = vi.fn().mockResolvedValue({ id: "from-retry" });
    const leafStep = defineLeafStep({
      install,
      meta: { install: { label: "Leaf" } },
      name: "leaf",
    });
    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Installation" } },
      name: "installation",
    });
    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    initialState.step.children[0].status = "succeeded";

    await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(install).not.toHaveBeenCalled();
  });

  test("should preserve data from initial state for skipped steps", async () => {
    const install = vi.fn().mockResolvedValue({ id: "new-result" });
    const leafStep = defineLeafStep({
      install,
      meta: { install: { label: "Leaf" } },
      name: "leaf",
    });
    const rootStep = defineBranchStep({
      children: [leafStep],
      meta: { install: { label: "Installation" } },
      name: "installation",
    });
    const initialState = createInitialState({
      config: minimalValidConfig,
      rootStep,
    });
    initialState.step.children[0].status = "succeeded";
    initialState.data = { installation: { leaf: { id: "from-first-run" } } };

    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("succeeded");
    expect((result.data as Record<string, unknown>).installation).toMatchObject(
      {
        leaf: { id: "from-first-run" },
      },
    );
  });
});
