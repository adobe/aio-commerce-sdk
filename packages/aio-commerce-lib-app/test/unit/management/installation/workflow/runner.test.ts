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
  executeUninstallWorkflow,
  executeWorkflow,
} from "#management/installation/workflow/runner";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockInstallationContext,
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
      name: "root",
      meta: { label: "Root" },
      children: [],
    });

    const state = createInitialState({ rootStep, config: minimalValidConfig });

    expect(state.id).toBeDefined();
    expect(typeof state.id).toBe("string");
    expect(state.id.length).toBeGreaterThan(0);
    expect(state.status).toBe("in-progress");
  });

  test("should build step status from root step with name and meta", () => {
    const rootStep = defineBranchStep({
      name: "installation",
      meta: { label: "Installation", description: "Main installation" },
      children: [],
    });

    const state = createInitialState({ rootStep, config: minimalValidConfig });

    expect(state.step.name).toBe("installation");
    expect(state.step.meta).toEqual({
      label: "Installation",
      description: "Main installation",
    });
    expect(state.step.status).toBe("pending");
  });

  test("should filter children based on when conditions (include steps where when returns true)", () => {
    const includedStep = defineLeafStep({
      name: "included",
      meta: { label: "Included" },
      run: vi.fn(),

      // @ts-expect-error It's for testing
      when: () => true,
    });

    const excludedStep = defineLeafStep({
      name: "excluded",
      meta: { label: "Excluded" },
      run: vi.fn(),

      // @ts-expect-error It's for testing
      when: () => false,
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [includedStep, excludedStep],
    });

    const state = createInitialState({ rootStep, config: minimalValidConfig });
    expect(state.step.children).toHaveLength(1);
    expect(state.step.children[0].name).toBe("included");
  });

  test("should recursively build children for branch steps", () => {
    const grandchildStep = defineLeafStep({
      name: "grandchild",
      meta: { label: "Grandchild" },
      run: vi.fn(),
    });

    const childBranch = defineBranchStep({
      name: "child-branch",
      meta: { label: "Child Branch" },
      children: [grandchildStep],
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [childBranch],
    });

    const state = createInitialState({ rootStep, config: minimalValidConfig });
    expect(state.step.children).toHaveLength(1);
    expect(state.step.children[0].name).toBe("child-branch");
    expect(state.step.children[0].children).toHaveLength(1);
    expect(state.step.children[0].children[0].name).toBe("grandchild");
  });

  test("should handle leaf steps (no children)", () => {
    const leafStep = defineLeafStep({
      name: "leaf",
      meta: { label: "Leaf" },
      run: vi.fn(),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const state = createInitialState({ rootStep, config: minimalValidConfig });

    expect(state.step.children).toHaveLength(1);
    expect(state.step.children[0].name).toBe("leaf");
    expect(state.step.children[0].children).toEqual([]);
  });

  test("should use uninstallMeta for steps when mode is 'uninstall'", () => {
    const childStep = defineLeafStep({
      name: "child",
      meta: { label: "Install Child", description: "Installs something" },
      uninstallMeta: {
        label: "Uninstall Child",
        description: "Removes something",
      },
      run: vi.fn(),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Installation" },
      uninstallMeta: { label: "Uninstallation" },
      children: [childStep],
    });

    const state = createInitialState({
      rootStep,
      config: minimalValidConfig,
      mode: "uninstall",
    });

    expect(state.step.meta).toEqual({ label: "Uninstallation" });
    expect(state.step.children[0].meta).toEqual({
      label: "Uninstall Child",
      description: "Removes something",
    });
  });

  test("should fall back to meta when uninstallMeta is absent and mode is 'uninstall'", () => {
    const childStep = defineLeafStep({
      name: "child",
      meta: { label: "Install Child" },
      run: vi.fn(),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Installation" },
      children: [childStep],
    });

    const state = createInitialState({
      rootStep,
      config: minimalValidConfig,
      mode: "uninstall",
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
      name: "step1",
      meta: { label: "Step 1" },
      run: () => "result",
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("succeeded");
    expect(result.id).toBe(initialState.id);
  });

  test("should fall back to INSTALLATION_FAILED when a success hook throws after execution completes", async () => {
    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks: {
        onInstallationSuccess: () => {
          throw new Error("hook failed");
        },
      },
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
      name: "failing",
      meta: { label: "Failing Step" },
      run: () => {
        throw new Error("Step failed");
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [failingStep],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Step failed");
    }
  });

  test("should call onInstallationStart hook at the beginning", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: () => "result",
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationStart).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "in-progress",
        id: initialState.id,
      }),
    );
  });

  test("should call onInstallationSuccess hook on success", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: () => "result",
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const hooks: InstallationHooks = {
      onInstallationSuccess: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        id: initialState.id,
      }),
    );
  });

  test("should call onInstallationFailure hook on failure", async () => {
    const failingStep = defineLeafStep({
      name: "failing",
      meta: { label: "Failing" },
      run: () => {
        throw new Error("Failure");
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [failingStep],
    });

    const hooks: InstallationHooks = {
      onInstallationFailure: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationFailure).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        id: initialState.id,
        error: expect.objectContaining({
          message: "Failure",
        }),
      }),
    );
  });

  test("should call onStepStart, onStepSuccess for each step", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: () => "result",
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const hooks: InstallationHooks = {
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    // Called for root and step1
    expect(hooks.onStepStart).toHaveBeenCalledTimes(2);
    expect(hooks.onStepSuccess).toHaveBeenCalledTimes(2);

    // Verify step1 was called
    expect(hooks.onStepStart).toHaveBeenCalledWith(
      expect.objectContaining({ stepName: "step1", isLeaf: true }),
      expect.any(Object),
    );

    expect(hooks.onStepSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ stepName: "step1", isLeaf: true }),
      expect.any(Object),
    );
  });

  test("should call onStepFailure when a step fails", async () => {
    const failingStep = defineLeafStep({
      name: "failing",
      meta: { label: "Failing" },
      run: () => {
        throw new Error("Step error");
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [failingStep],
    });

    const hooks: InstallationHooks = {
      onStepFailure: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    // Called for failing step and root (which also fails due to child failure)
    expect(hooks.onStepFailure).toHaveBeenCalledTimes(2);
    expect(hooks.onStepFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        stepName: "failing",
        isLeaf: true,
        error: expect.objectContaining({ message: "Step error" }),
      }),
      expect.any(Object),
    );
  });

  test("should execute leaf step run functions with config and context", async () => {
    const runFn = vi.fn().mockReturnValue("result");
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: runFn,
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const installationContext = createMockInstallationContext();
    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    await executeWorkflow({
      rootStep,
      installationContext,
      config: minimalValidConfig,
      initialState,
    });

    expect(runFn).toHaveBeenCalledTimes(1);
    expect(runFn).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({
        params: installationContext.params,
        logger: installationContext.logger,
      }),
    );
  });

  test("should store leaf step results in data at the correct path", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: () => ({ key: "value" }),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
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
      name: "step1",
      meta: { label: "Step 1" },
      run: () => {
        executionOrder.push("step1");
        return "result1";
      },
    });

    const step2 = defineLeafStep({
      name: "step2",
      meta: { label: "Step 2" },
      run: () => {
        executionOrder.push("step2");
        return "result2";
      },
    });

    const step3 = defineLeafStep({
      name: "step3",
      meta: { label: "Step 3" },
      run: () => {
        executionOrder.push("step3");
        return "result3";
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [step1, step2, step3],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });
    await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(executionOrder).toEqual(["step1", "step2", "step3"]);
  });

  test("should return a failed state when the initial state references a child step missing from the definition", async () => {
    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    initialState.step.children.push({
      id: "missing-child-id",
      name: "missing-child",
      path: ["root", "missing-child"],
      meta: { label: "Missing Child" },
      status: "pending",
      children: [],
    });

    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error.message).toBe('Step "missing-child" not found');
    }
  });

  test("should tolerate a malformed step object that is neither branch nor leaf", async () => {
    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [],
    });
    Reflect.set(rootStep, "type", "unknown");

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
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
      name: "step1",
      meta: { label: "Step 1" },
      run: vi.fn(),
      uninstall: uninstallFn,
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const installationContext = createMockInstallationContext();
    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeUninstallWorkflow({
      rootStep,
      installationContext,
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("succeeded");
    expect(uninstallFn).toHaveBeenCalledTimes(1);
    expect(uninstallFn).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({
        params: installationContext.params,
        logger: installationContext.logger,
      }),
    );
  });

  test("should silently skip steps that do not have an uninstall handler", async () => {
    const runFn = vi.fn().mockReturnValue("result");
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: runFn,
      // no uninstall handler
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeUninstallWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    // Step should succeed even without an uninstall handler
    expect(result.status).toBe("succeeded");
    // The run function should NOT be called during uninstall
    expect(runFn).not.toHaveBeenCalled();
  });

  test("should return failed state when an uninstall handler throws", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: vi.fn(),
      uninstall: () => {
        throw new Error("Uninstall failed");
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeUninstallWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Uninstall failed");
    }
  });

  test("should call lifecycle hooks the same way as executeWorkflow", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: vi.fn(),
      uninstall: vi.fn(),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
      onInstallationSuccess: vi.fn(),
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    await executeUninstallWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    // Called for root and step1
    expect(hooks.onStepStart).toHaveBeenCalledTimes(2);
    expect(hooks.onStepSuccess).toHaveBeenCalledTimes(2);
  });

  test("should not store step results in data during uninstall", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: vi.fn().mockReturnValue({ key: "value" }),
      uninstall: vi.fn(),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeUninstallWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    // No step results stored during uninstall (uninstall returns void, not keyed data)
    expect(result.status).toBe("succeeded");
    // data may be initialized to an empty object, but no step results are nested in it
    expect(result.data).not.toHaveProperty("root.step1");
  });

  test("should call onInstallationFailure hook when uninstall handler throws", async () => {
    const leafStep = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: vi.fn(),
      uninstall: () => {
        throw new Error("Uninstall error");
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [leafStep],
    });

    const hooks: InstallationHooks = {
      onInstallationFailure: vi.fn(),
    };

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    await executeUninstallWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationFailure).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        id: initialState.id,
        error: expect.objectContaining({
          message: "Uninstall error",
        }),
      }),
    );
  });

  test("should handle mixed scenario — some steps have uninstall, some do not", async () => {
    const uninstallFn = vi.fn();
    const runFn2 = vi.fn().mockReturnValue("result2");

    const step1 = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: vi.fn(),
      uninstall: uninstallFn,
    });

    const step2 = defineLeafStep({
      name: "step2",
      meta: { label: "Step 2" },
      run: runFn2,
      // no uninstall handler
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [step1, step2],
    });

    const initialState = createInitialState({
      rootStep,
      config: minimalValidConfig,
    });

    const result = await executeUninstallWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    // step1's uninstall should be called
    expect(uninstallFn).toHaveBeenCalledTimes(1);
    // step2 should be silently skipped, run should not be called
    expect(runFn2).not.toHaveBeenCalled();
    // Overall workflow result should be succeeded
    expect(result.status).toBe("succeeded");
  });
});
