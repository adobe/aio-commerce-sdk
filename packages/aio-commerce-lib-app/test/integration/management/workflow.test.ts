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
      name: "child",
      meta: { install: { label: "Child" } },
      install: installFn,
    });

    const branchStep = defineBranchStep({
      name: "branch",
      meta: { install: { label: "Branch" } },
      context: async () => ({ sharedValue: "from-branch" }),
      children: [leafStep],
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { install: { label: "Root" } },
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
      name: "step1",
      meta: { install: { label: "Step 1" } },
      install: () => "result",
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { install: { label: "Root" } },
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
      meta: { install: { label: "Failing" } },
      install: () => {
        throw new Error("Failure");
      },
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { install: { label: "Root" } },
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
      meta: { install: { label: "Deep Leaf" } },
      install: (_config, ctx) => {
        receivedContexts.push({ ...ctx });
        return "deep-result";
      },
    });

    const innerBranch = defineBranchStep({
      name: "inner-branch",
      meta: { install: { label: "Inner Branch" } },
      context: async () => ({
        innerValue: "from-inner",
        shared: "inner-override",
      }),
      children: [deepLeaf],
    });

    const outerBranch = defineBranchStep({
      name: "outer-branch",
      meta: { install: { label: "Outer Branch" } },
      context: async () => ({
        outerValue: "from-outer",
        shared: "outer-original",
      }),
      children: [innerBranch],
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { install: { label: "Root" } },
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
      meta: { install: { label: "Step 1" } },
      install: () => ({ provider: "provider-123", created: true }),
    });

    const step2 = defineLeafStep({
      name: "step2",
      meta: { install: { label: "Step 2" } },
      install: () => ({ registrations: ["reg-1", "reg-2"] }),
    });

    const step3 = defineLeafStep({
      name: "step3",
      meta: { install: { label: "Step 3" } },
      install: () => ({ subscriptions: 5, status: "active" }),
    });

    const rootStep = defineBranchStep({
      name: "root",
      meta: { install: { label: "Root" } },
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
      meta: { install: { label: "Commerce Events" } },
      install: () => ({ providerId: "commerce-provider" }),
    });

    const eventsLeaf2 = defineLeafStep({
      name: "external",
      meta: { install: { label: "External Events" } },
      install: () => ({ providerId: "external-provider" }),
    });

    const eventsBranch = defineBranchStep({
      name: "eventing",
      meta: { install: { label: "Eventing" } },
      children: [eventsLeaf1, eventsLeaf2],
    });

    const webhooksLeaf = defineLeafStep({
      name: "subscriptions",
      meta: { install: { label: "Subscriptions" } },
      install: () => ({ count: 3 }),
    });

    const webhooksBranch = defineBranchStep({
      name: "webhooks",
      meta: { install: { label: "Webhooks" } },
      children: [webhooksLeaf],
    });

    const rootStep = defineBranchStep({
      name: "installation",
      meta: { install: { label: "Installation" } },
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
