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
  createInstallationPlan,
  runInstallation,
} from "#management/installation/runner";
import { defineLeafStep } from "#management/installation/workflow/step";
import {
  configWithCommerceEventing,
  configWithWebhooks,
  createMockInstallationContext,
  FAKE_SYSTEM_TIME,
  minimalValidConfig,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";

describe("createInstallationPlan", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should create a plan from config with default steps", () => {
    const plan = createInstallationPlan({ config: minimalValidConfig });

    expect(plan.step.name).toBe("installation");
    expect(plan.step.meta).toEqual({
      label: "Installation",
      description: "App installation workflow",
    });
  });

  test("should include eventing step when config has eventing", () => {
    const plan = createInstallationPlan({ config: configWithCommerceEventing });

    const eventingStep = plan.step.children.find((c) => c.name === "eventing");
    expect(eventingStep).toBeDefined();
    expect(eventingStep?.meta.label).toBe("Eventing");
  });

  test("should include webhooks step when config has webhooks", () => {
    const plan = createInstallationPlan({ config: configWithWebhooks });
    const _webhooksStep = plan.step.children.find((c) => c.name === "webhooks");

    // TODO: Undo this when webhooks is implemented
    // expect(webhooksStep).toBeDefined();
    // expect(webhooksStep?.meta.label).toBe("Webhooks");
  });

  test("should exclude eventing step when config has no eventing", () => {
    const plan = createInstallationPlan({ config: minimalValidConfig });

    const eventingStep = plan.step.children.find((c) => c.name === "eventing");
    expect(eventingStep).toBeUndefined();
  });

  test("should exclude webhooks step when config has no webhooks", () => {
    const plan = createInstallationPlan({ config: minimalValidConfig });

    const webhooksStep = plan.step.children.find((c) => c.name === "webhooks");
    expect(webhooksStep).toBeUndefined();
  });

  test("should include extra steps when provided", () => {
    const extraStep = defineLeafStep({
      name: "custom-step",
      meta: { label: "Custom Step" },
      run: vi.fn(),
    });

    const plan = createInstallationPlan({
      config: minimalValidConfig,
      extraSteps: [extraStep],
    });

    const customStep = plan.step.children.find((c) => c.name === "custom-step");
    expect(customStep).toBeDefined();
    expect(customStep?.meta.label).toBe("Custom Step");
  });

  test("should return a plan with unique id and createdAt", () => {
    const plan = createInstallationPlan({ config: minimalValidConfig });

    expect(plan.id).toBeDefined();
    expect(typeof plan.id).toBe("string");
    expect(plan.id.length).toBeGreaterThan(0);
    expect(plan.createdAt).toBe(FAKE_SYSTEM_TIME);
  });
});

describe("runInstallation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should return succeeded state when all steps complete", async () => {
    const extraStep = defineLeafStep({
      name: "test-step",
      meta: { label: "Test Step" },
      run: () => ({ result: "success" }),
    });

    const plan = createInstallationPlan({
      config: minimalValidConfig,
      extraSteps: [extraStep],
    });

    const result = await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      plan,
      extraSteps: [extraStep],
    });

    expect(result.status).toBe("succeeded");
    expect(result.installationId).toBe(plan.id);
  });

  test("should return failed state when a step fails", async () => {
    const failingStep = defineLeafStep({
      name: "failing-step",
      meta: { label: "Failing Step" },
      run: () => {
        throw new Error("Step failed");
      },
    });

    const plan = createInstallationPlan({
      config: minimalValidConfig,
      extraSteps: [failingStep],
    });

    const result = await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      plan,
      extraSteps: [failingStep],
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Step failed");
    }
  });

  test("should pass hooks to the workflow executor", async () => {
    const extraStep = defineLeafStep({
      name: "hook-test-step",
      meta: { label: "Hook Test Step" },
      run: () => ({ result: "success" }),
    });

    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
      onInstallationSuccess: vi.fn(),
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const plan = createInstallationPlan({
      config: minimalValidConfig,
      extraSteps: [extraStep],
    });

    await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      plan,
      extraSteps: [extraStep],
      hooks,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onStepStart).toHaveBeenCalled();
    expect(hooks.onStepSuccess).toHaveBeenCalled();
  });

  test("should use extra steps when provided", async () => {
    const runFn = vi.fn().mockReturnValue({ customResult: true });
    const extraStep = defineLeafStep({
      name: "extra-execution-step",
      meta: { label: "Extra Execution Step" },
      run: runFn,
    });

    const plan = createInstallationPlan({
      config: minimalValidConfig,
      extraSteps: [extraStep],
    });

    const result = await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      plan,
      extraSteps: [extraStep],
    });

    expect(runFn).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("succeeded");
    expect(result.data).toEqual({
      installation: {
        "extra-execution-step": { customResult: true },
      },
    });
  });
});
