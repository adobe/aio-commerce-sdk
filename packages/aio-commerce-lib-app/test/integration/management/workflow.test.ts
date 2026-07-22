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
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockInstallationContext,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";

describe("executeWorkflow — multi-level interactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should pass context from branch step context factory to children", async () => {
    const installFn = vi.fn().mockReturnValue("result");

    const leafStep = defineLeafStep({
      install: installFn,
      meta: { install: { label: "Child" } },
      name: "child",
    });

    const branchStep = defineBranchStep({
      children: [leafStep],
      context: async () => ({ sharedValue: "from-branch" }),
      meta: { install: { label: "Branch" } },
      name: "branch",
    });

    const rootStep = defineBranchStep({
      children: [branchStep],
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

    expect(installFn).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.objectContaining({
        sharedValue: "from-branch",
      }),
    );
  });

  test("should set step status to in-progress then succeeded on success", async () => {
    const statusDuringExecution: string[] = [];

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
      onStepStart: (info, state) => {
        if (info.stepName === "step1") {
          const [step1Status] = state.step.children;
          statusDuringExecution.push(`start:${step1Status.status}`);
        }
      },
      onStepSuccess: (info, state) => {
        if (info.stepName === "step1") {
          const [step1Status] = state.step.children;
          statusDuringExecution.push(`success:${step1Status.status}`);
        }
      },
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

    expect(statusDuringExecution).toEqual([
      "start:in-progress",
      "success:succeeded",
    ]);
  });

  test("should set step status to in-progress then failed on failure", async () => {
    const statusDuringExecution: string[] = [];

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
      onStepFailure: (info, state) => {
        if (info.stepName === "failing") {
          const [stepStatus] = state.step.children;
          statusDuringExecution.push(`failure:${stepStatus.status}`);
        }
      },
      onStepStart: (info, state) => {
        if (info.stepName === "failing") {
          const [stepStatus] = state.step.children;
          statusDuringExecution.push(`start:${stepStatus.status}`);
        }
      },
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

    expect(statusDuringExecution).toEqual([
      "start:in-progress",
      "failure:failed",
    ]);
  });

  test("should inherit and merge context through nested branch steps", async () => {
    const receivedContexts: Record<string, unknown>[] = [];

    const deepLeaf = defineLeafStep({
      install: (_config, ctx) => {
        receivedContexts.push({ ...ctx });
        return "deep-result";
      },
      meta: { install: { label: "Deep Leaf" } },
      name: "deep-leaf",
    });

    const innerBranch = defineBranchStep({
      children: [deepLeaf],
      context: async () => ({
        innerValue: "from-inner",
        shared: "inner-override",
      }),
      meta: { install: { label: "Inner Branch" } },
      name: "inner-branch",
    });

    const outerBranch = defineBranchStep({
      children: [innerBranch],
      context: async () => ({
        outerValue: "from-outer",
        shared: "outer-original",
      }),
      meta: { install: { label: "Outer Branch" } },
      name: "outer-branch",
    });

    const rootStep = defineBranchStep({
      children: [outerBranch],
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

    // The deep leaf should receive merged context from both branches
    // Inner branch context should override outer branch context for 'shared' key
    expect(receivedContexts).toHaveLength(1);
    expect(receivedContexts[0]).toMatchObject({
      innerValue: "from-inner",
      outerValue: "from-outer",
      shared: "inner-override", // Inner overrides outer
    });
  });

  test("should accumulate results from multiple leaf steps in data", async () => {
    const step1 = defineLeafStep({
      install: () => ({ created: true, provider: "provider-123" }),
      meta: { install: { label: "Step 1" } },
      name: "step1",
    });

    const step2 = defineLeafStep({
      install: () => ({ registrations: ["reg-1", "reg-2"] }),
      meta: { install: { label: "Step 2" } },
      name: "step2",
    });

    const step3 = defineLeafStep({
      install: () => ({ status: "active", subscriptions: 5 }),
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
    const result = await executeWorkflow({
      config: minimalValidConfig,
      initialState,
      installationContext: createMockInstallationContext(),
      rootStep,
    });

    expect(result.status).toBe("succeeded");
    expect(result.data).toEqual({
      root: {
        step1: { created: true, provider: "provider-123" },
        step2: { registrations: ["reg-1", "reg-2"] },
        step3: { status: "active", subscriptions: 5 },
      },
    });
  });

  test("should accumulate results from nested branch structures", async () => {
    const eventsLeaf1 = defineLeafStep({
      install: () => ({ providerId: "commerce-provider" }),
      meta: { install: { label: "Commerce Events" } },
      name: "commerce",
    });

    const eventsLeaf2 = defineLeafStep({
      install: () => ({ providerId: "external-provider" }),
      meta: { install: { label: "External Events" } },
      name: "external",
    });

    const eventsBranch = defineBranchStep({
      children: [eventsLeaf1, eventsLeaf2],
      meta: { install: { label: "Eventing" } },
      name: "eventing",
    });

    const webhooksLeaf = defineLeafStep({
      install: () => ({ count: 3 }),
      meta: { install: { label: "Subscriptions" } },
      name: "subscriptions",
    });

    const webhooksBranch = defineBranchStep({
      children: [webhooksLeaf],
      meta: { install: { label: "Webhooks" } },
      name: "webhooks",
    });

    const rootStep = defineBranchStep({
      children: [eventsBranch, webhooksBranch],
      meta: { install: { label: "Installation" } },
      name: "installation",
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
