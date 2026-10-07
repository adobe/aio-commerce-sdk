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
  LifecycleBaselineNotFoundError,
  LifecycleOrchestrationError,
  LifecycleStateNotInitializedError,
  StaleLifecycleAttemptError,
} from "#management/lifecycle/errors";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
  readOrInitializeState,
  requireCurrentAttempt,
  requireState,
} from "#management/lifecycle/state";
import { createMockLogger } from "#test/fixtures/installation";
import {
  createMockAppStateSnapshot,
  createMockLifecycleAttempt,
  createMockLifecycleRuntime,
  createMockLifecycleStore,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";
import { createMockStepStatus } from "#test/fixtures/workflow";

import type {
  AppStateSnapshot,
  OrchestrationState,
} from "#management/common/orchestration";

const PAST = "2000-01-01T00:00:00.000Z";
const FUTURE = "2999-01-01T00:00:00.000Z";

function createSnapshot(id: string): AppStateSnapshot {
  return createMockAppStateSnapshot({ id });
}

function pendingAttempt(deadline = FUTURE) {
  return createMockLifecycleAttempt({ executionDeadline: deadline });
}

function succeededAttempt(deadline = FUTURE) {
  return createMockLifecycleAttempt({
    executionDeadline: deadline,
    status: "succeeded",
  });
}

function createRuntime(args: {
  state?: OrchestrationState;
  baselineFor: (snapshotId: string | null) => AppStateSnapshot | null;
}) {
  const stateStore = createMockLifecycleStore({ initial: args.state });
  const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
  const baselineProvider = {
    get: vi.fn(async (snapshotId: string | null) =>
      args.baselineFor(snapshotId),
    ),
  };
  const { runtime } = createMockLifecycleRuntime({
    baselineProvider,
    snapshotStore,
    stateStore,
  });

  return { baselineProvider, runtime, snapshotStore, stateStore };
}

/** Captures the error rejected by a lifecycle operation. */
async function captureError(operation: Promise<unknown>) {
  return await operation.catch((error: unknown) => error);
}

describe("lifecycle orchestration error types", () => {
  test("reports a missing baseline snapshot as LifecycleBaselineNotFoundError", async () => {
    const { runtime } = createRuntime({
      baselineFor: () => null,
      state: createMockOrchestrationState(),
    });

    const error = await captureError(readOrInitializeState(runtime));
    expect(error).toBeInstanceOf(LifecycleBaselineNotFoundError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
  });

  test("reports uninitialized state as LifecycleStateNotInitializedError", async () => {
    const store = createMockLifecycleStore<OrchestrationState>();

    const error = await captureError(requireState(store));
    expect(error).toBeInstanceOf(LifecycleStateNotInitializedError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
  });

  test("reports a stale attempt as StaleLifecycleAttemptError carrying its id", async () => {
    const state = createMockOrchestrationState({
      latestAttempt: pendingAttempt(FUTURE),
    });

    const store = createMockLifecycleStore({ initial: state });
    const error = await captureError(requireCurrentAttempt(store, "other"));

    expect(error).toBeInstanceOf(StaleLifecycleAttemptError);
    expect(error).toBeInstanceOf(LifecycleOrchestrationError);
    expect(error).toHaveProperty("attemptId", "other");
  });
});

describe("readOrInitializeState", () => {
  test("returns the existing state and baseline", async () => {
    const baseline = createSnapshot("snapshot-1");
    const state = createMockOrchestrationState();
    const { runtime } = createRuntime({
      baselineFor: () => baseline,
      state,
    });

    const result = await readOrInitializeState(runtime);
    expect(result).toEqual({ baseline, state });
  });

  test("throws when the recorded baseline snapshot can no longer be resolved", async () => {
    const state = createMockOrchestrationState();
    const { runtime } = createRuntime({ baselineFor: () => null, state });

    await expect(readOrInitializeState(runtime)).rejects.toThrow(
      "baseline snapshot is missing",
    );
  });

  test("returns no baseline for a state without a snapshot id", async () => {
    const state = createMockOrchestrationState({ baselineSnapshotId: null });
    const { runtime, baselineProvider } = createRuntime({
      baselineFor: () => createSnapshot("unused"),
      state,
    });

    expect(await readOrInitializeState(runtime)).toEqual({
      baseline: null,
      state,
    });
    expect(baselineProvider.get).not.toHaveBeenCalled();
  });

  test("returns an empty state and no baseline when nothing is stored", async () => {
    const { runtime, stateStore } = createRuntime({
      baselineFor: () => createSnapshot("unused"),
    });

    expect(await readOrInitializeState(runtime)).toEqual({
      baseline: null,
      state: {
        baselineSnapshotId: null,
        latestAttempt: null,
        pendingPlan: null,
      },
    });
    expect(await stateStore.get(CURRENT_STATE_KEY)).toBeNull();
  });
});

describe("normalizeExpiredAttempt", () => {
  test("returns state unchanged when there is no attempt", async () => {
    const store = createMockLifecycleStore<OrchestrationState>();
    const state = createMockOrchestrationState();

    expect(await normalizeExpiredAttempt(store, state)).toEqual(state);
  });

  test("returns state unchanged when the attempt is already terminal", async () => {
    const store = createMockLifecycleStore<OrchestrationState>();
    const state = createMockOrchestrationState({
      latestAttempt: succeededAttempt(PAST),
    });

    expect(await normalizeExpiredAttempt(store, state)).toEqual(state);
  });

  test("returns state unchanged when the active attempt has not yet expired", async () => {
    const store = createMockLifecycleStore<OrchestrationState>();
    const state = createMockOrchestrationState({
      latestAttempt: pendingAttempt(FUTURE),
    });

    expect(await normalizeExpiredAttempt(store, state)).toEqual(state);
  });

  test("marks an expired active attempt as failed and persists it", async () => {
    const store = createMockLifecycleStore<OrchestrationState>();
    const state = createMockOrchestrationState({
      latestAttempt: pendingAttempt(PAST),
    });

    const normalized = await normalizeExpiredAttempt(store, state);
    expect(normalized.latestAttempt).toMatchObject({
      failure: { key: "LIFECYCLE_ATTEMPT_EXPIRED" },
      status: "failed",
    });

    expect(await store.get(CURRENT_STATE_KEY)).toEqual(normalized);
  });

  test("warns with the attempt id and the step that was in progress when an attempt expires", async () => {
    const logger = createMockLogger();
    const attempt = createMockLifecycleAttempt({
      executionDeadline: PAST,
      id: "attempt-expired",
      progress: createMockStepStatus({
        children: [
          createMockStepStatus({
            path: ["root", "webhooks"],
            startedAt: "1999-12-31T23:59:00.000Z",
            status: "in-progress",
          }),
        ],
        status: "in-progress",
      }),
      status: "in-progress",
    });

    await normalizeExpiredAttempt(
      createMockLifecycleStore<OrchestrationState>(),
      createMockOrchestrationState({ latestAttempt: attempt }),
      logger,
    );

    expect(logger.warn).toHaveBeenCalledWith(
      `The upgrade attempt attempt-expired expired at its execution deadline ${PAST} while step root/webhooks was in progress since 1999-12-31T23:59:00.000Z.`,
    );
  });

  test("does not warn when the attempt has not expired", async () => {
    const logger = createMockLogger();
    await normalizeExpiredAttempt(
      createMockLifecycleStore<OrchestrationState>(),
      createMockOrchestrationState({ latestAttempt: pendingAttempt() }),
      logger,
    );

    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe("requireState", () => {
  test("returns the current orchestration state", async () => {
    const state = createMockOrchestrationState();
    const store = createMockLifecycleStore({ initial: state });

    expect(await requireState(store)).toEqual(state);
  });

  test("throws when orchestration state is uninitialized", async () => {
    const store = createMockLifecycleStore<OrchestrationState>();
    await expect(requireState(store)).rejects.toThrow(
      "has not been initialized",
    );
  });
});

describe("requireCurrentAttempt", () => {
  test("returns state when the attempt id and deadline are valid", async () => {
    const state = createMockOrchestrationState({
      latestAttempt: pendingAttempt(FUTURE),
    });

    const store = createMockLifecycleStore({ initial: state });
    expect(await requireCurrentAttempt(store, "attempt-1")).toEqual(state);
  });

  test("throws when the attempt id does not match the latest attempt", async () => {
    const state = createMockOrchestrationState({
      latestAttempt: pendingAttempt(FUTURE),
    });

    const store = createMockLifecycleStore({ initial: state });
    await expect(requireCurrentAttempt(store, "other")).rejects.toThrow(
      "stale",
    );
  });

  test("throws when the latest attempt is already terminal", async () => {
    const state = createMockOrchestrationState({
      latestAttempt: succeededAttempt(FUTURE),
    });

    const store = createMockLifecycleStore({ initial: state });
    await expect(requireCurrentAttempt(store, "attempt-1")).rejects.toThrow(
      "stale",
    );
  });

  test("throws when the attempt deadline has passed", async () => {
    const state = createMockOrchestrationState({
      latestAttempt: pendingAttempt(PAST),
    });

    const store = createMockLifecycleStore({ initial: state });
    await expect(requireCurrentAttempt(store, "attempt-1")).rejects.toThrow(
      "stale",
    );
  });
});
