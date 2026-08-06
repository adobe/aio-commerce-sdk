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
    executeUpdateWorkflow: vi
      .fn()
      .mockImplementation(actual.executeUpdateWorkflow),
  };
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createInitialInstallationState,
  runUpdate,
} from "#management/installation/runner";
import { executeUpdateWorkflow } from "#management/installation/workflow/index";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockFailedState,
  createMockInstallationContext,
  createMockStepStatus,
  createMockSucceededState,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

import type { InstallationHooks } from "#management/installation/workflow/hooks";
import type { UpdatePlan } from "#management/upgrade/types";

function createMockUpdatePlan(overrides: Partial<UpdatePlan> = {}): UpdatePlan {
  return {
    createdAt: FAKE_SYSTEM_TIME,
    diff: { changes: [] },
    planId: "plan-1",
    targetConfig: minimalValidConfig,
    ...overrides,
  };
}

describe("runUpdate", () => {
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

    const result = await runUpdate({
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
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

    await runUpdate({
      hooks,
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    expect(hooks.onInstallationStart).toHaveBeenCalledTimes(1);
    expect(hooks.onInstallationSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onStepStart).toHaveBeenCalled();
    expect(hooks.onStepSuccess).toHaveBeenCalled();
  });
});

describe("runUpdate — retry behavior", () => {
  let initialState!: ReturnType<typeof createInitialInstallationState>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
    vi.mocked(executeUpdateWorkflow).mockClear();
    initialState = createInitialInstallationState({
      config: minimalValidConfig,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should retry once and return succeeded with metadata.isRetry true when first attempt fails", async () => {
    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(createMockFailedState())
      .mockResolvedValueOnce(createMockSucceededState());

    const result = await runUpdate({
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    expect(result).toMatchObject({
      metadata: { isRetry: true },
      status: "succeeded",
    });
    expect((result as Record<string, unknown>).isRetry).toBeUndefined();
    expect(vi.mocked(executeUpdateWorkflow)).toHaveBeenCalledTimes(2);
  });

  test("should set metadata.isRetry true on failed result when both attempts fail", async () => {
    const failedState = createMockFailedState();
    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(failedState)
      .mockResolvedValueOnce(failedState);

    const result = await runUpdate({
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    expect(result).toMatchObject({
      metadata: { isRetry: true },
      status: "failed",
    });
  });

  test("should not call onInstallationFailure on first failed attempt", async () => {
    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(createMockFailedState())
      .mockResolvedValueOnce(createMockSucceededState());

    const onInstallationFailure = vi.fn();

    await runUpdate({
      hooks: { onInstallationFailure },
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    expect(onInstallationFailure).not.toHaveBeenCalled();
  });

  test("should suppress onStepFailure in first attempt so failed step state is not persisted before retry", async () => {
    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(createMockFailedState())
      .mockResolvedValueOnce(createMockSucceededState());

    const onStepFailure = vi.fn();

    await runUpdate({
      hooks: { onStepFailure },
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    expect(
      vi.mocked(executeUpdateWorkflow).mock.calls[0][0].hooks?.onStepFailure,
    ).toBeUndefined();
    expect(
      typeof vi.mocked(executeUpdateWorkflow).mock.calls[1][0].hooks
        ?.onStepFailure,
    ).toBe("function");
  });

  test("should wire onInstallationFailure to the retry attempt when both attempts fail", async () => {
    const failedState = createMockFailedState();
    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(failedState)
      .mockResolvedValueOnce(failedState);

    const onInstallationFailure = vi.fn();

    const result = await runUpdate({
      hooks: { onInstallationFailure },
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    expect(result.status).toBe("failed");
    expect(vi.mocked(executeUpdateWorkflow)).toHaveBeenCalledTimes(2);
    expect(
      typeof vi.mocked(executeUpdateWorkflow).mock.calls[1][0].hooks
        ?.onInstallationFailure,
    ).toBe("function");
  });

  test("should pass firstResult-based retry state (not fresh all-pending state) to second executeUpdateWorkflow call", async () => {
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

    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(failedState)
      .mockResolvedValueOnce(createMockSucceededState());

    await runUpdate({
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan(),
    });

    const secondCallInitialState = vi.mocked(executeUpdateWorkflow).mock
      .calls[1][0].initialState;
    expect(secondCallInitialState.step.children[0].status).toBe("succeeded");
    expect(secondCallInitialState.step.children[1].status).toBe("pending");
  });

  test("should log warning with step path, key and message when retrying", async () => {
    vi.mocked(executeUpdateWorkflow)
      .mockResolvedValueOnce(
        createMockFailedState({
          error: {
            key: "PROVIDER_CREATION_FAILED",
            message: "Provider already exists",
            path: ["eventing", "commerce"],
          },
        }),
      )
      .mockResolvedValueOnce(createMockSucceededState());

    const mockContext = createMockInstallationContext();

    await runUpdate({
      initialState,
      installationContext: mockContext,
      plan: createMockUpdatePlan(),
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

  test("should pass plan.diff to executeUpdateWorkflow", async () => {
    vi.mocked(executeUpdateWorkflow).mockResolvedValueOnce(
      createMockSucceededState(),
    );

    const diff = { changes: [] };
    await runUpdate({
      initialState,
      installationContext: createMockInstallationContext(),
      plan: createMockUpdatePlan({ diff }),
    });

    expect(vi.mocked(executeUpdateWorkflow).mock.calls[0][0].diff).toBe(diff);
  });
});
