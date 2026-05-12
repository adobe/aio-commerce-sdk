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

vi.mock("#management/installation/workflow/index", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("#management/installation/workflow/index")
    >();
  return {
    ...actual,
    executeWorkflow: vi.fn().mockImplementation(actual.executeWorkflow),
  };
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createInitialInstallationState,
  createInitialUninstallationState,
  runInstallation,
  runUninstallation,
} from "#management/installation/runner";
import { executeWorkflow } from "#management/installation/workflow/index";
import {
  configWithCommerceEventing,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockFailedState,
  createMockInstallationContext,
  createMockSucceededState,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";

describe("createInitialInstallationState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should create initial state from config with default steps", () => {
    const state = createInitialInstallationState({
      config: minimalValidConfig,
    });

    expect(state.status).toBe("in-progress");
    expect(state.step.name).toBe("installation");
    expect(state.step.meta).toEqual({
      label: "Installation",
      description: "App installation workflow",
    });
  });

  test("should include eventing step when config has eventing", () => {
    const state = createInitialInstallationState({
      config: configWithCommerceEventing,
    });

    const eventingStep = state.step.children.find((c) => c.name === "eventing");
    expect(eventingStep).toBeDefined();
    expect(eventingStep?.meta.label).toBe("Eventing");
  });

  test("should include webhooks step when config has webhooks", () => {
    const state = createInitialInstallationState({
      config: configWithWebhooks,
    });
    const webhooksStep = state.step.children.find((c) => c.name === "webhooks");

    expect(webhooksStep).toBeDefined();
    expect(webhooksStep?.meta.label).toBe("Webhooks");
  });

  test("should exclude eventing step when config has no eventing", () => {
    const state = createInitialInstallationState({
      config: minimalValidConfig,
    });

    const eventingStep = state.step.children.find((c) => c.name === "eventing");
    expect(eventingStep).toBeUndefined();
  });

  test("should exclude webhooks step when config has no webhooks", () => {
    const state = createInitialInstallationState({
      config: minimalValidConfig,
    });

    const webhooksStep = state.step.children.find((c) => c.name === "webhooks");
    expect(webhooksStep).toBeUndefined();
  });

  test("should return state with unique id and pending status", () => {
    const state = createInitialInstallationState({
      config: minimalValidConfig,
    });

    expect(state.id).toBeDefined();
    expect(typeof state.id).toBe("string");
    expect(state.id.length).toBeGreaterThan(0);
    expect(state.status).toBe("in-progress");
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
    const initialState = createInitialInstallationState({
      config: minimalValidConfig,
    });

    const result = await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("succeeded");
    expect(result.id).toBe(initialState.id);
  });

  test("should pass hooks to the workflow executor", async () => {
    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
      onInstallationSuccess: vi.fn(),
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const initialState = createInitialInstallationState({
      config: minimalValidConfig,
    });

    await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onStepStart).toHaveBeenCalled();
    expect(hooks.onStepSuccess).toHaveBeenCalled();
  });
});

describe("createInitialUninstallationState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should create initial state from config with default steps", () => {
    const state = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    expect(state.status).toBe("in-progress");
    expect(state.step.name).toBe("uninstallation");
    expect(state.step.meta).toEqual({
      label: "Uninstallation",
      description: "App uninstallation workflow",
    });
  });

  test("should include eventing step when config has eventing", () => {
    const state = createInitialUninstallationState({
      config: configWithCommerceEventing,
    });

    const eventingStep = state.step.children.find((c) => c.name === "eventing");
    expect(eventingStep).toBeDefined();
    expect(eventingStep?.meta.label).toBe("Eventing");
  });

  test("should include webhooks step when config has webhooks", () => {
    const state = createInitialUninstallationState({
      config: configWithWebhooks,
    });
    const webhooksStep = state.step.children.find((c) => c.name === "webhooks");

    expect(webhooksStep).toBeDefined();
    expect(webhooksStep?.meta.label).toBe("Webhooks");
  });

  test("should exclude eventing step when config has no eventing", () => {
    const state = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    const eventingStep = state.step.children.find((c) => c.name === "eventing");
    expect(eventingStep).toBeUndefined();
  });

  test("should exclude webhooks step when config has no webhooks", () => {
    const state = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    const webhooksStep = state.step.children.find((c) => c.name === "webhooks");
    expect(webhooksStep).toBeUndefined();
  });

  test("should return state with unique id and pending status", () => {
    const state = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    expect(state.id).toBeDefined();
    expect(typeof state.id).toBe("string");
    expect(state.id.length).toBeGreaterThan(0);
    expect(state.status).toBe("in-progress");
  });

  test("should use uninstall-specific descriptions for eventing and webhooks steps", () => {
    const state = createInitialUninstallationState({
      config: { ...configWithCommerceEventing, ...configWithWebhooks },
    });

    const eventingStep = state.step.children.find((c) => c.name === "eventing");
    expect(eventingStep?.meta.description).toBe(
      "Removes the I/O Events and Commerce events configured by the application",
    );

    const webhooksStep = state.step.children.find((c) => c.name === "webhooks");
    expect(webhooksStep?.meta.description).toBe("Removes Commerce webhooks");
  });
});

describe("runUninstallation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should return succeeded state when all steps complete", async () => {
    const initialState = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    const result = await runUninstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("succeeded");
    expect(result.id).toBe(initialState.id);
  });

  test("should pass hooks to the workflow executor", async () => {
    const hooks: InstallationHooks = {
      onInstallationStart: vi.fn(),
      onInstallationSuccess: vi.fn(),
      onStepStart: vi.fn(),
      onStepSuccess: vi.fn(),
    };

    const initialState = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    await runUninstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onStepStart).toHaveBeenCalled();
    expect(hooks.onStepSuccess).toHaveBeenCalled();
  });
});

describe("runInstallation — retry behavior", () => {
  let initialState!: ReturnType<typeof createInitialInstallationState>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
    vi.mocked(executeWorkflow).mockClear();
    initialState = createInitialInstallationState({
      config: minimalValidConfig,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should retry once and return succeeded with isRetry true when first attempt fails", async () => {
    vi.mocked(executeWorkflow)
      .mockResolvedValueOnce(createMockFailedState())
      .mockResolvedValueOnce(createMockSucceededState());

    const result = await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result).toMatchObject({ status: "succeeded", isRetry: true });
    expect(vi.mocked(executeWorkflow)).toHaveBeenCalledTimes(2);
  });

  test("should not call onInstallationFailure on first failed attempt", async () => {
    vi.mocked(executeWorkflow)
      .mockResolvedValueOnce(createMockFailedState())
      .mockResolvedValueOnce(createMockSucceededState());

    const onInstallationFailure = vi.fn();

    await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks: { onInstallationFailure },
    });

    expect(onInstallationFailure).not.toHaveBeenCalled();
  });

  test("should pass onInstallationFailure to the retry attempt when both attempts fail", async () => {
    const failedState = createMockFailedState();
    vi.mocked(executeWorkflow)
      .mockResolvedValueOnce(failedState)
      .mockResolvedValueOnce(failedState);

    const onInstallationFailure = vi.fn();

    const result = await runInstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
      hooks: { onInstallationFailure },
    });

    expect(result.status).toBe("failed");
    expect(vi.mocked(executeWorkflow)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(executeWorkflow).mock.calls[1][0].hooks).toMatchObject({
      onInstallationFailure,
    });
  });

  test("should log warning with step path, key and message when retrying", async () => {
    vi.mocked(executeWorkflow)
      .mockResolvedValueOnce(
        createMockFailedState({
          error: {
            path: ["eventing", "commerce"],
            key: "PROVIDER_CREATION_FAILED",
            message: "Provider already exists",
          },
        }),
      )
      .mockResolvedValueOnce(createMockSucceededState());

    const mockContext = createMockInstallationContext();

    await runInstallation({
      installationContext: mockContext,
      config: minimalValidConfig,
      initialState,
    });

    expect(mockContext.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("eventing.commerce"),
    );
    expect(mockContext.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("PROVIDER_CREATION_FAILED"),
    );
    expect(mockContext.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Provider already exists"),
    );
  });
});
