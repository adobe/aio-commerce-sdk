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
  executeWorkflow,
} from "#management/installation/workflow/runner";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";
import {
  createMockInstallationContext,
  FAKE_SYSTEM_TIME,
  minimalValidConfig,
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

  test("should pass context from branch step context factory to children", async () => {
    const runFn = vi.fn().mockReturnValue("result");

    const leafStep = defineLeafStep({
      name: "child",
      meta: { label: "Child" },
      run: runFn,
    });

    const branchStep = defineBranchStep({
      name: "branch",
      meta: { label: "Branch" },
      context: async () => ({ sharedValue: "from-branch" }),
      children: [leafStep],
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [branchStep],
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

    expect(runFn).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({
        sharedValue: "from-branch",
      }),
    );
  });

  test("should set step status to in-progress then succeeded on success", async () => {
    const statusDuringExecution: string[] = [];

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
      onStepStart: (info, state) => {
        if (info.stepName === "step1") {
          const step1Status = state.step.children[0];
          statusDuringExecution.push(`start:${step1Status.status}`);
        }
      },
      onStepSuccess: (info, state) => {
        if (info.stepName === "step1") {
          const step1Status = state.step.children[0];
          statusDuringExecution.push(`success:${step1Status.status}`);
        }
      },
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

    expect(statusDuringExecution).toEqual([
      "start:in-progress",
      "success:succeeded",
    ]);
  });

  test("should set step status to in-progress then failed on failure", async () => {
    const statusDuringExecution: string[] = [];

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
      onStepStart: (info, state) => {
        if (info.stepName === "failing") {
          const stepStatus = state.step.children[0];
          statusDuringExecution.push(`start:${stepStatus.status}`);
        }
      },
      onStepFailure: (info, state) => {
        if (info.stepName === "failing") {
          const stepStatus = state.step.children[0];
          statusDuringExecution.push(`failure:${stepStatus.status}`);
        }
      },
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

    expect(statusDuringExecution).toEqual([
      "start:in-progress",
      "failure:failed",
    ]);
  });

  test("should inherit and merge context through nested branch steps", async () => {
    const receivedContexts: Record<string, unknown>[] = [];

    const deepLeaf = defineLeafStep({
      name: "deep-leaf",
      meta: { label: "Deep Leaf" },
      run: (_config, ctx) => {
        receivedContexts.push({ ...ctx });
        return "deep-result";
      },
    });

    const innerBranch = defineBranchStep({
      name: "inner-branch",
      meta: { label: "Inner Branch" },
      context: async () => ({
        innerValue: "from-inner",
        shared: "inner-override",
      }),
      children: [deepLeaf],
    });

    const outerBranch = defineBranchStep({
      name: "outer-branch",
      meta: { label: "Outer Branch" },
      context: async () => ({
        outerValue: "from-outer",
        shared: "outer-original",
      }),
      children: [innerBranch],
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { label: "Root" },
      children: [outerBranch],
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

    // The deep leaf should receive merged context from both branches
    // Inner branch context should override outer branch context for 'shared' key
    expect(receivedContexts).toHaveLength(1);
    expect(receivedContexts[0]).toMatchObject({
      outerValue: "from-outer",
      innerValue: "from-inner",
      shared: "inner-override", // Inner overrides outer
    });
  });

  test("should accumulate results from multiple leaf steps in data", async () => {
    const step1 = defineLeafStep({
      name: "step1",
      meta: { label: "Step 1" },
      run: () => ({ provider: "provider-123", created: true }),
    });

    const step2 = defineLeafStep({
      name: "step2",
      meta: { label: "Step 2" },
      run: () => ({ registrations: ["reg-1", "reg-2"] }),
    });

    const step3 = defineLeafStep({
      name: "step3",
      meta: { label: "Step 3" },
      run: () => ({ subscriptions: 5, status: "active" }),
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
    const result = await executeWorkflow({
      rootStep,
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("succeeded");
    expect(result.data).toEqual({
      root: {
        step1: { provider: "provider-123", created: true },
        step2: { registrations: ["reg-1", "reg-2"] },
        step3: { subscriptions: 5, status: "active" },
      },
    });
  });

  test("should accumulate results from nested branch structures", async () => {
    const eventsLeaf1 = defineLeafStep({
      name: "commerce",
      meta: { label: "Commerce Events" },
      run: () => ({ providerId: "commerce-provider" }),
    });

    const eventsLeaf2 = defineLeafStep({
      name: "external",
      meta: { label: "External Events" },
      run: () => ({ providerId: "external-provider" }),
    });

    const eventsBranch = defineBranchStep({
      name: "eventing",
      meta: { label: "Eventing" },
      children: [eventsLeaf1, eventsLeaf2],
    });

    const webhooksLeaf = defineLeafStep({
      name: "subscriptions",
      meta: { label: "Subscriptions" },
      run: () => ({ count: 3 }),
    });

    const webhooksBranch = defineBranchStep({
      name: "webhooks",
      meta: { label: "Webhooks" },
      children: [webhooksLeaf],
    });

    const rootStep = defineBranchStep({
      name: "installation",
      meta: { label: "Installation" },
      children: [eventsBranch, webhooksBranch],
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
    expect(result.data).toEqual({
      installation: {
        eventing: {
          commerce: { providerId: "commerce-provider" },
          external: { providerId: "external-provider" },
        },
        webhooks: {
          subscriptions: { count: 3 },
        },
      },
    });
  });
});
