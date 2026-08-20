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
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
  readOrInitializeState,
  requireCurrentAttempt,
  requireState,
} from "#management/lifecycle/state";
import {
  createMockAppStateSnapshot,
  createMockLifecycleAttempt,
  createMockLifecycleRuntime,
  createMockLifecycleStore,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";

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

  test("adopts the compatibility baseline when the existing state has no snapshot id", async () => {
    const baseline = createSnapshot("compat-1");
    const state = createMockOrchestrationState({ baselineSnapshotId: null });
    const { runtime, snapshotStore, stateStore } = createRuntime({
      baselineFor: () => baseline,
      state,
    });

    const result = await readOrInitializeState(runtime);

    expect(result.baseline).toEqual(baseline);
    expect(result.state.baselineSnapshotId).toBe("compat-1");
    expect(await snapshotStore.get("compat-1")).toEqual(baseline);
    expect(await stateStore.get(CURRENT_STATE_KEY)).toMatchObject({
      baselineSnapshotId: "compat-1",
    });
  });

  test("initializes fresh state from the compatibility baseline when none exists", async () => {
    const baseline = createSnapshot("compat-1");
    const { runtime, snapshotStore, stateStore } = createRuntime({
      baselineFor: (snapshotId) => (snapshotId === null ? baseline : null),
    });

    const result = await readOrInitializeState(runtime);
    expect(result.state).toEqual({
      baselineSnapshotId: "compat-1",
      latestAttempt: null,
      pendingPlan: null,
    });

    expect(await snapshotStore.get("compat-1")).toEqual(baseline);
    expect(await stateStore.get(CURRENT_STATE_KEY)).toEqual(result.state);
  });

  test("throws when no compatible baseline exists and no state is recorded", async () => {
    const { runtime } = createRuntime({ baselineFor: () => null });
    await expect(readOrInitializeState(runtime)).rejects.toThrow(
      "compatible lifecycle baseline is required",
    );
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
