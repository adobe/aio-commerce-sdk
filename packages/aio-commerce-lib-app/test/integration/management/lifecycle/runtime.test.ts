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
  BlockedLifecyclePlanError,
  InvalidExecutionDeadlineError,
  InvalidStartDeadlineError,
  LifecycleAttemptActionVersionMismatchError,
  LifecycleAttemptAlreadyExecutingError,
  LifecycleAttemptInProgressError,
  LifecycleAttemptNotFoundError,
  LifecycleBaselineNotFoundError,
  LifecycleOrchestrationError,
  LifecyclePlanActionVersionMismatchError,
  PendingLifecyclePlanNotFoundError,
} from "#management/lifecycle/errors";
import { executeLifecycleAttempt } from "#management/lifecycle/execution";
import { planLifecycle } from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import { createMockConfig } from "#test/fixtures/config";
import {
  createMockAppStateSnapshot,
  createMockLifecycleRuntime,
  createMockLifecycleStore,
} from "#test/fixtures/lifecycle";
import {
  createMockBranchStep,
  createMockLifecycleLeaf,
  createMockLifecycleRoot,
} from "#test/fixtures/workflow";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";
import type { BranchStep } from "#management/common/workflow/step";

const EXECUTION_DEADLINE = "2099-01-01T00:00:00.000Z";

function createConfig(version: string): CommerceAppConfigOutputModel {
  return createMockConfig({
    metadata: { id: "synthetic-app", version },
  });
}

function createBaseline(
  version: string,
  data: AppStateSnapshot["data"] = null,
): AppStateSnapshot {
  return createMockAppStateSnapshot({
    config: createConfig(version),
    data,
    id: `baseline-${version}`,
  });
}

/** Captures the error rejected by a lifecycle operation. */
async function captureError(operation: Promise<unknown>) {
  return await operation.catch((error: unknown) => error);
}

describe("lifecycle orchestration error types", () => {
  function createRuntime(rootStep?: BranchStep) {
    return createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
      rootStep,
    });
  }

  async function planUpgrade(
    runtime: ReturnType<typeof createMockLifecycleRuntime>["runtime"],
    actionVersion = "1.0.0",
  ) {
    return await planLifecycle({
      ...runtime,
      actionVersion,
      operation: "upgrade",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });
  }

  test("reports an unknown plan id as PendingLifecyclePlanNotFoundError", async () => {
    const { runtime } = createRuntime();
    await planUpgrade(runtime);

    const error = await captureError(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: EXECUTION_DEADLINE,
        planId: "stale-plan",
      }),
    );

    expect(error).toBeInstanceOf(PendingLifecyclePlanNotFoundError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("planId", "stale-plan");
  });

  test("reports a foreign plan as LifecyclePlanActionVersionMismatchError", async () => {
    const { runtime } = createRuntime();
    const planning = await planUpgrade(runtime);

    const error = await captureError(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "2.0.0",
        executionDeadline: EXECUTION_DEADLINE,
        planId: planning.plan.id,
      }),
    );

    expect(error).toBeInstanceOf(LifecyclePlanActionVersionMismatchError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("actionVersion", "1.0.0");
  });

  test("reports a blocked plan as BlockedLifecyclePlanError carrying its id", async () => {
    const { runtime } = createRuntime(
      createMockLifecycleRoot([
        createMockLifecycleLeaf({
          apply: vi.fn(),
          plan: vi.fn().mockResolvedValue({
            issues: [
              {
                code: "MISSING_CONFIGURATION",
                domain: "synthetic",
                message: "Configuration is required",
              },
            ],
            kind: "blocked",
          }),
        }),
      ]),
    );

    const planning = await planUpgrade(runtime);
    const error = await captureError(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: EXECUTION_DEADLINE,
        planId: planning.plan.id,
      }),
    );

    expect(error).toBeInstanceOf(BlockedLifecyclePlanError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("planId", planning.plan.id);
  });

  test("reports an invalid start deadline as InvalidStartDeadlineError", async () => {
    const { runtime } = createRuntime();
    const planning = await planUpgrade(runtime);

    const error = await captureError(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: "not-a-date",
        planId: planning.plan.id,
      }),
    );

    expect(error).toBeInstanceOf(InvalidStartDeadlineError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("executionDeadline", "not-a-date");
  });

  test("reports planning during an active attempt as LifecycleAttemptInProgressError", async () => {
    const { runtime } = createRuntime();
    const planning = await planUpgrade(runtime);
    await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const error = await captureError(planUpgrade(runtime, "1.0.1"));
    expect(error).toBeInstanceOf(LifecycleAttemptInProgressError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
  });

  test("reports an unknown attempt id as LifecycleAttemptNotFoundError", async () => {
    const { runtime } = createRuntime();
    const planning = await planUpgrade(runtime);
    await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const error = await captureError(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: "stale-attempt",
        executionDeadline: EXECUTION_DEADLINE,
      }),
    );

    expect(error).toBeInstanceOf(LifecycleAttemptNotFoundError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("attemptId", "stale-attempt");
  });

  test("reports a foreign attempt as LifecycleAttemptActionVersionMismatchError", async () => {
    const { runtime } = createRuntime();
    const planning = await planUpgrade(runtime);
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const error = await captureError(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "2.0.0",
        attemptId: attempt.id,
        executionDeadline: EXECUTION_DEADLINE,
      }),
    );

    expect(error).toBeInstanceOf(LifecycleAttemptActionVersionMismatchError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("actionVersion", "1.0.0");
  });

  test("reports a running attempt as LifecycleAttemptAlreadyExecutingError", async () => {
    const { runtime, stateStore } = createRuntime();
    const planning = await planUpgrade(runtime);
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const state = await stateStore.get("current");
    expect.assert(state?.latestAttempt, "Expected a persisted attempt");
    await stateStore.put("current", {
      ...state,
      latestAttempt: { ...state.latestAttempt, status: "in-progress" },
    });

    const error = await captureError(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: attempt.id,
        executionDeadline: EXECUTION_DEADLINE,
      }),
    );

    expect(error).toBeInstanceOf(LifecycleAttemptAlreadyExecutingError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("attemptId", attempt.id);
  });

  test("reports an invalid execution deadline as InvalidExecutionDeadlineError", async () => {
    const { runtime } = createRuntime();
    const planning = await planUpgrade(runtime);
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const error = await captureError(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: attempt.id,
        executionDeadline: "not-a-date",
      }),
    );

    expect(error).toBeInstanceOf(InvalidExecutionDeadlineError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("executionDeadline", "not-a-date");
  });

  test("reports a missing execution baseline as LifecycleBaselineNotFoundError", async () => {
    const baseline = createBaseline("1.0.0");
    const { runtime, snapshotStore } = createMockLifecycleRuntime({ baseline });

    const planning = await planUpgrade(runtime);
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await snapshotStore.delete(baseline.id);
    const error = await captureError(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: attempt.id,
        executionDeadline: EXECUTION_DEADLINE,
      }),
    );

    expect(error).toBeInstanceOf(LifecycleBaselineNotFoundError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
  });
});

describe("lifecycle runtime", () => {
  test("plans, starts, applies, retries, and commits a snapshot", async () => {
    const apply = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue({
        snapshotData: { remoteId: "resource-1" },
      });

    const leaf = createMockLifecycleLeaf({
      apply,
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { name: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });

    const rootStep = createMockLifecycleRoot([leaf]);
    const baseline = createBaseline("1.0.0");
    const targetConfig = createConfig("2.0.0");
    const { runtime, snapshotStore, stateStore } = createMockLifecycleRuntime({
      baseline,
      rootStep,
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig,
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");

    const started = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });
    expect(apply).toHaveBeenCalledTimes(2);
    expect.assert(
      completed.status === "succeeded",
      "Expected a succeeded lifecycle attempt",
    );

    const committedSnapshot = await snapshotStore.get(
      completed.result.snapshotId,
    );

    expect(committedSnapshot).toMatchObject({
      config: targetConfig,
      data: { root: { synthetic: { remoteId: "resource-1" } } },
    });

    expect((await stateStore.get("current"))?.baselineSnapshotId).toBe(
      completed.result.snapshotId,
    );

    const nextPlanning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.1",
      targetAppVersion: "3.0.0",
      targetConfig: createConfig("3.0.0"),
    });

    expect(nextPlanning.plan.source?.appVersion).toBe("2.0.0");
  });

  test("records the execution delivery deadline on the completed attempt", async () => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const started = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: "2098-01-01T00:00:00.000Z",
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(completed.executionDeadline).toBe(EXECUTION_DEADLINE);
  });

  test("returns a succeeded attempt after an action version change without applying it again", async () => {
    const apply = vi.fn().mockResolvedValue({
      snapshotData: { remoteId: "resource-1" },
    });

    const rootStep = createMockLifecycleRoot([
      createMockLifecycleLeaf({
        apply,
        plan: vi.fn().mockResolvedValue({
          kind: "planned",
          plan: {
            operations: [
              {
                after: { name: "resource" },
                id: "add-resource",
                kind: "add",
                label: "Add resource",
              },
            ],
            path: ["root", "synthetic"],
          },
        }),
      }),
    ]);

    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
      rootStep,
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const started = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    const repeated = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(repeated).toEqual(completed);
    expect(apply).toHaveBeenCalledOnce();
  });

  test("does not re-enter an attempt that is already in progress", async () => {
    let notifyApplyStarted: () => void = vi.fn();
    let releaseApply: () => void = vi.fn();

    const applyStarted = new Promise<void>((resolve) => {
      notifyApplyStarted = resolve;
    });

    const applyReleased = new Promise<void>((resolve) => {
      releaseApply = resolve;
    });

    const leaf = createMockLifecycleLeaf({
      apply: vi.fn(async () => {
        notifyApplyStarted();
        await applyReleased;
        return { snapshotData: { id: "resource" } };
      }),

      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { id: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });

    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const planning = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "upgrade",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const execution = executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: attempt.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    await applyStarted;

    try {
      await expect(
        executeLifecycleAttempt({
          ...runtime,
          actionVersion: "1.0.0",
          attemptId: attempt.id,
          executionDeadline: EXECUTION_DEADLINE,
        }),
      ).rejects.toThrow("already in progress");
    } finally {
      releaseApply();
    }

    await expect(execution).resolves.toMatchObject({ status: "succeeded" });
  });

  test("stops before execution when the plan baseline is missing", async () => {
    const apply = vi.fn();
    const baseline = createBaseline("1.0.0");

    const leaf = createMockLifecycleLeaf({
      apply,
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { id: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });

    const { runtime, snapshotStore, stateStore } = createMockLifecycleRuntime({
      baseline,
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const planning = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "upgrade",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await snapshotStore.delete(baseline.id);
    await expect(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: attempt.id,
        executionDeadline: EXECUTION_DEADLINE,
      }),
    ).rejects.toThrow("baseline snapshot is missing");

    expect(apply).not.toHaveBeenCalled();
    expect((await stateStore.get("current"))?.latestAttempt).toMatchObject({
      id: attempt.id,
      status: "pending",
    });
  });

  test("persists blocked plans and skips replanning the same action version", async () => {
    const plan = vi.fn().mockResolvedValue({
      issues: [
        {
          code: "MISSING_CONFIGURATION",
          domain: "synthetic",
          message: "Configuration is required",
        },
      ],
      kind: "blocked",
    });

    const leaf = createMockLifecycleLeaf({
      apply: vi.fn(),
      plan,
    });

    const { runtime, stateStore } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const result = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "upgrade",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect(result.kind).toBe("blocked");
    expect(result.plan.issues).toEqual([
      expect.objectContaining({ code: "MISSING_CONFIGURATION" }),
    ]);

    expect((await stateStore.get("current"))?.pendingPlan?.id).toBe(
      result.plan.id,
    );

    await expect(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: EXECUTION_DEADLINE,
        planId: result.plan.id,
      }),
    ).rejects.toThrow("blocked by planning issues");

    const skipped = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "upgrade",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect(skipped).toEqual({ ...result, skipped: true });
    expect(plan).toHaveBeenCalledOnce();
  });

  test("persists an executable plan when no domain operations are required", async () => {
    const config = createConfig("1.0.0");
    const leaf = createMockLifecycleLeaf({
      apply: vi.fn(),
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [],
          path: ["root", "synthetic"],
        },
      }),
    });

    const baseline = createBaseline("1.0.0", {
      root: { synthetic: { remoteId: "resource-1" } },
    });

    const { runtime, stateStore } = createMockLifecycleRuntime({
      baseline,
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const result = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "upgrade",
      targetAppVersion: "1.0.0",
      targetConfig: config,
    });

    expect(result.kind).toBe("planned");
    expect(result.plan.domains[0]?.operations).toEqual([]);
    expect((await stateStore.get("current"))?.pendingPlan?.id).toBe(
      result.plan.id,
    );
  });

  test("commits version-only plans without invoking apply", async () => {
    const config = createConfig("2.0.0");
    const apply = vi.fn();

    const leaf = createMockLifecycleLeaf({
      apply,
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [],
          path: ["root", "synthetic"],
        },
      }),
    });

    const baseline = createBaseline("1.0.0", {
      root: { synthetic: { remoteId: "resource-1" } },
    });

    const { runtime, snapshotStore, stateStore } = createMockLifecycleRuntime({
      baseline,
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: config,
    });

    expect.assert(planning.kind === "planned", "Expected a version-only plan");
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: attempt.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(completed.progress.status).toBe("succeeded");
    expect.assert(
      completed.status === "succeeded",
      "Expected a succeeded lifecycle attempt",
    );

    expect(apply).not.toHaveBeenCalled();
    expect(await snapshotStore.get(completed.result.snapshotId)).toMatchObject({
      config,
      data: baseline.data,
    });

    expect((await stateStore.get("current"))?.baselineSnapshotId).toBe(
      completed.result.snapshotId,
    );
  });

  test("plans and applies nested leaves selected by either baseline or target config", async () => {
    const removedLeaf = createMockLifecycleLeaf({
      apply: async () => ({ snapshotData: null }),
      name: "removed",
      plan: async ({
        baseline: leafBaseline,
        targetConfig: leafTargetConfig,
      }) => ({
        kind: "planned",
        plan: {
          operations:
            leafBaseline && !leafTargetConfig
              ? [
                  {
                    before: leafBaseline.data,
                    id: "remove-old",
                    kind: "remove",
                    label: "Remove old resource",
                  },
                ]
              : [],
          path: ["root", "removed-parent", "removed"],
        },
      }),
    });

    const removedParent = createMockBranchStep({
      children: [removedLeaf],
      isConfigured: (config): config is CommerceAppConfigOutputModel =>
        config.metadata.version === "1.0.0",
      meta: {
        install: { label: "Removed parent" },
        upgrade: { label: "Removed parent" },
      },
      name: "removed-parent",
    });

    const addedLeaf = createMockLifecycleLeaf({
      apply: async (_plan, { targetConfig: leafTargetConfig }) => ({
        snapshotData: leafTargetConfig ? { id: "new" } : null,
      }),
      name: "added",
      plan: async ({
        baseline: leafBaseline,
        targetConfig: leafTargetConfig,
      }) => ({
        kind: "planned",
        plan: {
          operations:
            !leafBaseline && leafTargetConfig
              ? [
                  {
                    after: { id: "new" },
                    id: "add-new",
                    kind: "add",
                    label: "Add new resource",
                  },
                ]
              : [],
          path: ["root", "added-parent", "added"],
        },
      }),
    });

    const addedParent = createMockBranchStep({
      children: [addedLeaf],
      isConfigured: (config): config is CommerceAppConfigOutputModel =>
        config.metadata.version === "2.0.0",
      meta: {
        install: { label: "Added parent" },
        upgrade: { label: "Added parent" },
      },
      name: "added-parent",
    });

    const inactiveLeaf = createMockLifecycleLeaf({
      apply: vi.fn(),
      isConfigured: () => false,

      name: "inactive",
      plan: async () => ({
        kind: "planned",
        plan: {
          operations: [],
          path: ["root", "inactive"],
        },
      }),
    });

    const baselineConfig = createConfig("1.0.0");
    const targetConfig = createConfig("2.0.0");
    const baseline = createMockAppStateSnapshot({
      config: baselineConfig,
      data: {
        root: {
          "removed-parent": {
            removed: { id: "old" },
          },
        },
      },
      id: "installation-1",
    });

    const { runtime, snapshotStore } = createMockLifecycleRuntime({
      baseline,
      rootStep: createMockLifecycleRoot([
        removedParent,
        addedParent,
        inactiveLeaf,
      ]),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig,
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    expect(planning.plan.domains).toEqual([
      expect.objectContaining({
        operations: [expect.objectContaining({ kind: "remove" })],
        path: ["root", "removed-parent", "removed"],
      }),
      expect.objectContaining({
        operations: [expect.objectContaining({ kind: "add" })],
        path: ["root", "added-parent", "added"],
      }),
      {
        operations: [],
        path: ["root", "inactive"],
      },
    ]);

    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: attempt.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect.assert(
      completed.status === "succeeded",
      "Expected a succeeded lifecycle attempt",
    );

    expect(await snapshotStore.get(completed.result.snapshotId)).toMatchObject({
      config: targetConfig,
      data: {
        root: {
          "added-parent": {
            added: { id: "new" },
          },
          "removed-parent": {
            removed: null,
          },
        },
      },
    });
  });

  test("rejects stale plan ids", async () => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect(planning.kind).toBe("planned");
    await expect(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: EXECUTION_DEADLINE,
        planId: "stale-plan",
      }),
    ).rejects.toThrow("missing or stale");
  });

  test("skips the same action version and replaces plans from older versions", async () => {
    const { runtime, stateStore } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });

    const planOptions = {
      ...runtime,
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    };

    const first = await planLifecycle({
      ...planOptions,
      actionVersion: "1.0.0",
      operation: "upgrade",
    });

    expect.assert(first.kind === "planned", "Expected an executable plan");
    const skipped = await planLifecycle({
      ...planOptions,
      actionVersion: "1.0.0",
      operation: "upgrade",
    });

    expect(skipped).toEqual({ ...first, skipped: true });
    const replacement = await planLifecycle({
      ...planOptions,
      actionVersion: "1.0.1",
      operation: "upgrade",
    });

    expect(replacement.kind).toBe("planned");
    expect((await stateStore.get("current"))?.pendingPlan?.id).not.toBe(
      first.plan.id,
    );
  });

  test("rejects stale attempt ids", async () => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await expect(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: "stale-attempt",
        executionDeadline: EXECUTION_DEADLINE,
      }),
    ).rejects.toThrow("missing or stale");
  });

  test("keeps the prior baseline when both apply attempts fail", async () => {
    const apply = vi.fn().mockRejectedValue(new Error("permanent"));
    const config = createConfig("2.0.0");
    const leaf = createMockLifecycleLeaf({
      apply,
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { id: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });

    const baseline = createMockAppStateSnapshot({
      config: createConfig("1.0.0"),
      data: { root: { synthetic: { id: "old" } } },
      id: "baseline-1",
    });

    const { runtime, stateStore } = createMockLifecycleRuntime({
      baseline,
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: config,
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: attempt.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(completed.status).toBe("failed");
    expect(apply).toHaveBeenCalledTimes(2);
    expect((await stateStore.get("current"))?.baselineSnapshotId).toBe(
      "baseline-1",
    );
  });

  test("returns a failed attempt after an action version change without applying it again", async () => {
    const apply = vi.fn().mockRejectedValue(new Error("permanent"));
    const leaf = createMockLifecycleLeaf({
      apply,
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { id: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });

    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: attempt.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    const repeated = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "2.0.0",
      attemptId: attempt.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(repeated).toEqual(completed);
    expect(apply).toHaveBeenCalledTimes(2);
  });

  test("resumes a failed apply attempt when the same plan is requested again", async () => {
    const apply = vi
      .fn()
      .mockRejectedValueOnce(new Error("first failure"))
      .mockRejectedValueOnce(new Error("retry failure"))
      .mockResolvedValue({ snapshotData: { id: "resource" } });

    const leaf = createMockLifecycleLeaf({
      apply,
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { id: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });

    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
      rootStep: createMockLifecycleRoot([leaf]),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const firstAttempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await expect(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: firstAttempt.id,
        executionDeadline: EXECUTION_DEADLINE,
      }),
    ).resolves.toMatchObject({ status: "failed" });

    const repeatedPlanning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    const resumed = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: repeatedPlanning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: resumed.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(resumed.id).toBe(firstAttempt.id);
    expect(completed.status).toBe("succeeded");
  });

  test("does not select a new baseline when the final state write fails", async () => {
    let failStateWrite = false;
    let targetSnapshotId: string | null = null;

    const stateStore = createMockLifecycleStore<OrchestrationState>({
      onPut: () => {
        if (failStateWrite) {
          throw new Error("state unavailable");
        }
      },
    });

    const snapshotStore = createMockLifecycleStore<AppStateSnapshot>({
      onPut: (key) => {
        if (key !== "baseline-1") {
          failStateWrite = true;
          targetSnapshotId = key;
        }
      },
    });

    const baseline = { ...createBaseline("1.0.0"), id: "baseline-1" };
    const config = createConfig("2.0.0");
    const leaf = createMockLifecycleLeaf({
      apply: vi.fn().mockResolvedValue({
        snapshotData: { id: "resource" },
      }),
      plan: vi.fn().mockResolvedValue({
        kind: "planned",
        plan: {
          operations: [
            {
              after: { id: "resource" },
              id: "add-resource",
              kind: "add",
              label: "Add resource",
            },
          ],
          path: ["root", "synthetic"],
        },
      }),
    });
    const { runtime } = createMockLifecycleRuntime({
      baseline,
      rootStep: createMockLifecycleRoot([leaf]),
      snapshotStore,
      stateStore,
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: config,
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await expect(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: attempt.id,
        executionDeadline: EXECUTION_DEADLINE,
      }),
    ).rejects.toThrow("state unavailable");

    expect.assert(
      targetSnapshotId,
      "Expected the target snapshot to be persisted",
    );

    expect(await snapshotStore.get(targetSnapshotId)).toMatchObject({
      config,
      data: { root: { synthetic: { id: "resource" } } },
    });

    expect((await stateStore.get("current"))?.baselineSnapshotId).toBe(
      "baseline-1",
    );
  });

  test("rejects starting a plan created by another action version", async () => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });
    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    await expect(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "2.0.0",
        executionDeadline: EXECUTION_DEADLINE,
        planId: planning.plan.id,
      }),
    ).rejects.toThrow("another action version");
  });

  test.each([
    ["invalid", "not-a-date"],
    ["elapsed", "2000-01-01T00:00:00.000Z"],
  ])("rejects an %s start deadline", async (_case, executionDeadline) => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });
    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    await expect(
      startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline,
        planId: planning.plan.id,
      }),
    ).rejects.toThrow("invalid or has already elapsed");
  });

  test("blocks new plans while an attempt is active", async () => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await expect(
      planLifecycle({
        operation: "upgrade",
        ...runtime,
        actionVersion: "1.0.1",
        targetAppVersion: "3.0.0",
        targetConfig: createConfig("3.0.0"),
      }),
    ).rejects.toThrow("already in progress");
  });

  test.each([
    ["invalid", "not-a-date"],
    ["elapsed", "2000-01-01T00:00:00.000Z"],
  ])("rejects an %s execution deadline", async (_case, executionDeadline) => {
    const { runtime } = createMockLifecycleRuntime({
      baseline: createBaseline("1.0.0"),
    });

    const planning = await planLifecycle({
      operation: "upgrade",
      ...runtime,
      actionVersion: "1.0.0",
      targetAppVersion: "2.0.0",
      targetConfig: createConfig("2.0.0"),
    });

    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    await expect(
      executeLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        attemptId: attempt.id,
        executionDeadline,
      }),
    ).rejects.toThrow("deadline is invalid or elapsed");
  });

  test("expires active attempts so newer plans and attempts are not blocked", async () => {
    vi.useFakeTimers();

    try {
      vi.setSystemTime("2026-08-10T10:00:00.000Z");

      const stateStore = createMockLifecycleStore<OrchestrationState>();
      const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();

      const { runtime } = createMockLifecycleRuntime({
        baseline: createBaseline("1.0.0"),
        snapshotStore,
        stateStore,
      });

      const first = await planLifecycle({
        operation: "upgrade",
        ...runtime,
        actionVersion: "1.0.0",
        targetAppVersion: "2.0.0",
        targetConfig: createConfig("2.0.0"),
      });

      const active = await startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: "2026-08-10T10:01:00.000Z",
        planId: first.plan.id,
      });

      vi.setSystemTime("2026-08-10T10:02:00.000Z");
      const skipped = await planLifecycle({
        operation: "upgrade",
        ...runtime,
        actionVersion: "1.0.0",
        targetAppVersion: "2.0.0",
        targetConfig: createConfig("2.0.0"),
      });
      expect(skipped).toEqual({ ...first, skipped: true });

      const resumed = await startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.0",
        executionDeadline: "2026-08-10T10:03:00.000Z",
        planId: skipped.plan.id,
      });

      expect(resumed.id).toBe(active.id);

      vi.setSystemTime("2026-08-10T10:04:00.000Z");
      const replacement = await planLifecycle({
        operation: "upgrade",
        ...runtime,
        actionVersion: "1.0.1",
        targetAppVersion: "3.0.0",
        targetConfig: createConfig("3.0.0"),
      });

      expect(replacement.kind).toBe("planned");
      expect((await stateStore.get("current"))?.latestAttempt).toEqual(
        expect.objectContaining({
          id: active.id,
          status: "failed",
        }),
      );

      const restarted = await startLifecycleAttempt({
        ...runtime,
        actionVersion: "1.0.1",
        executionDeadline: "2026-08-10T10:05:00.000Z",
        planId: replacement.plan.id,
      });
      expect(restarted.status).toBe("pending");
    } finally {
      vi.useRealTimers();
    }
  });

  test("plans and applies an uninstall towards no target", async () => {
    const removeOnlyPlan = (name: string) =>
      vi.fn(async ({ baseline: leafBaseline, targetConfig: leafTarget }) => ({
        kind: "planned" as const,
        plan: {
          operations:
            leafBaseline && !leafTarget
              ? [
                  {
                    before: leafBaseline.data,
                    id: `remove-${name}`,
                    kind: "remove" as const,
                    label: `Remove ${name}`,
                  },
                ]
              : [],
          path: ["root", name],
        },
      }));

    const appliedTargets: unknown[] = [];
    const apply = vi.fn(async (_plan, context) => {
      appliedTargets.push(context.targetConfig);
      return { snapshotData: null };
    });

    const leafMeta = {
      install: { label: "Synthetic domain" },
      uninstall: { label: "Synthetic domain" },
    };
    const rootStep = createMockLifecycleRoot(
      [
        createMockLifecycleLeaf({
          apply,
          meta: leafMeta,
          plan: removeOnlyPlan("synthetic"),
        }),
        createMockLifecycleLeaf({
          apply,
          meta: leafMeta,
          name: "secondary",
          plan: removeOnlyPlan("secondary"),
        }),
      ],
      {
        meta: {
          install: { label: "Lifecycle" },
          uninstall: { label: "Lifecycle" },
        },
      },
    );

    const baseline = createBaseline("1.0.0", {
      root: {
        secondary: { remoteId: "resource-2" },
        synthetic: { remoteId: "resource-1" },
      },
    });

    const { runtime, snapshotStore, stateStore } = createMockLifecycleRuntime({
      baseline,
      rootStep,
    });

    const planning = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "uninstall",
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    expect(planning.plan.target).toBeNull();
    expect(planning.plan.operation).toBe("uninstall");

    const operations = planning.plan.domains.flatMap(
      (domain) => domain.operations,
    );
    expect(operations.map((operation) => operation.kind)).toEqual([
      "remove",
      "remove",
    ]);

    const started = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(completed.status).toBe("succeeded");
    expect(appliedTargets).toEqual([null, null]);
    expect(await stateStore.get("current")).toBeNull();
    expect(await snapshotStore.get(baseline.id)).toBeNull();
    expect(snapshotStore.put).not.toHaveBeenCalled();
  });

  test("plans and applies a first install from no baseline", async () => {
    const addOnlyPlan = (name: string) =>
      vi.fn(async ({ baseline: leafBaseline, targetConfig: leafTarget }) => ({
        kind: "planned" as const,
        plan: {
          operations:
            !leafBaseline && leafTarget
              ? [
                  {
                    after: { name },
                    id: `add-${name}`,
                    kind: "add" as const,
                    label: `Add ${name}`,
                  },
                ]
              : [],
          path: ["root", name],
        },
      }));

    const applied: unknown[] = [];
    const apply = vi.fn(async (_plan, context) => {
      applied.push(context.baseline);
      return { snapshotData: { remoteId: "resource-1" } };
    });

    const rootStep = createMockLifecycleRoot([
      createMockLifecycleLeaf({ apply, plan: addOnlyPlan("synthetic") }),
      createMockLifecycleLeaf({
        apply,
        name: "secondary",
        plan: addOnlyPlan("secondary"),
      }),
    ]);

    const targetConfig = createConfig("1.0.0");
    const { runtime, snapshotStore, stateStore } = createMockLifecycleRuntime({
      baseline: null,
      rootStep,
    });

    const planning = await planLifecycle({
      ...runtime,
      actionVersion: "1.0.0",
      operation: "install",
      targetAppVersion: "1.0.0",
      targetConfig,
    });

    expect.assert(planning.kind === "planned", "Expected an executable plan");
    expect(planning.plan.source).toBeNull();
    expect(planning.plan.domains).toEqual([
      expect.objectContaining({ path: ["root", "synthetic"] }),
      expect.objectContaining({ path: ["root", "secondary"] }),
    ]);

    const operations = planning.plan.domains.flatMap(
      (domain) => domain.operations,
    );
    expect(operations).toHaveLength(2);
    expect(operations.map((operation) => operation.kind)).toEqual([
      "add",
      "add",
    ]);

    const started = await startLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      executionDeadline: EXECUTION_DEADLINE,
      planId: planning.plan.id,
    });

    vi.mocked(snapshotStore.get).mockClear();
    const completed = await executeLifecycleAttempt({
      ...runtime,
      actionVersion: "1.0.0",
      attemptId: started.id,
      executionDeadline: EXECUTION_DEADLINE,
    });

    expect(snapshotStore.get).not.toHaveBeenCalled();
    expect(applied).toEqual([null, null]);
    expect.assert(
      completed.status === "succeeded",
      "Expected a succeeded lifecycle attempt",
    );

    expect(await snapshotStore.get(completed.result.snapshotId)).toMatchObject({
      config: targetConfig,
      data: {
        root: {
          secondary: { remoteId: "resource-1" },
          synthetic: { remoteId: "resource-1" },
        },
      },
    });

    expect((await stateStore.get("current"))?.baselineSnapshotId).toBe(
      completed.result.snapshotId,
    );
  });
});
