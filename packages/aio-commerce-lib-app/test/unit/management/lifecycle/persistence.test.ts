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

import { describe, expect, test } from "vitest";

import {
  persistApplyFailure,
  persistProgress,
  persistSuccess,
} from "#management/lifecycle/persistence";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";
import {
  createMockFailedState,
  createMockInProgressState,
  createMockSucceededState,
} from "#test/fixtures/installation";
import {
  createMockAppStateSnapshot,
  createMockLifecycleAttempt,
  createMockLifecyclePlan,
  createMockLifecycleStore,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";

import type { AppStateSnapshot } from "#management/common/orchestration";

const plan = createMockLifecyclePlan();

describe("persistProgress", () => {
  test("records in-progress data and step tree for the current attempt", async () => {
    const attempt = createMockLifecycleAttempt({ plan });
    const store = createMockLifecycleStore({
      initial: createMockOrchestrationState({ latestAttempt: attempt }),
    });
    const progressState = createMockInProgressState({
      data: { foo: "bar" },
      id: "installation-1",
    });

    await persistProgress(store, "attempt-1", progressState);

    expect(await store.get(CURRENT_STATE_KEY)).toMatchObject({
      latestAttempt: {
        data: { foo: "bar" },
        progress: progressState.step,
        status: "in-progress",
      },
    });
  });

  test("throws when the attempt is no longer current", async () => {
    const store = createMockLifecycleStore({
      initial: createMockOrchestrationState({
        latestAttempt: createMockLifecycleAttempt({ plan }),
      }),
    });
    const progressState = createMockInProgressState({ id: "installation-1" });

    await expect(
      persistProgress(store, "other-attempt", progressState),
    ).rejects.toThrow("stale");
  });
});

describe("persistApplyFailure", () => {
  test("maps the workflow error onto a failed attempt and persists it", async () => {
    const baseline = createMockAppStateSnapshot();
    const attempt = createMockLifecycleAttempt({ plan });
    const state = createMockOrchestrationState({ latestAttempt: attempt });
    const stateStore = createMockLifecycleStore({ initial: state });
    const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    const workflow = createMockFailedState({ id: "installation-1" });

    const failed = await persistApplyFailure(
      { snapshotStore, stateStore },
      state,
      attempt,
      baseline,
      workflow,
    );

    expect(failed).toMatchObject({
      failure: {
        key: workflow.error.key,
        message: workflow.error.message,
        path: workflow.error.path,
      },
      status: "failed",
    });

    expect(await stateStore.get(CURRENT_STATE_KEY)).toMatchObject({
      latestAttempt: failed,
    });
  });

  test("preserves the failure payload in the returned and persisted attempt", async () => {
    const baseline = createMockAppStateSnapshot();
    const attempt = createMockLifecycleAttempt({ plan });
    const state = createMockOrchestrationState({ latestAttempt: attempt });
    const stateStore = createMockLifecycleStore({ initial: state });
    const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    const workflow = createMockFailedState({
      error: {
        key: "STEP_EXECUTION_FAILED",
        message: "Resource update failed",
        path: ["root", "resource"],
        payload: { operationId: "operation-1" },
      },
    });

    const failed = await persistApplyFailure(
      { snapshotStore, stateStore },
      state,
      attempt,
      baseline,
      workflow,
    );
    expect(failed).toMatchObject({
      failure: { payload: { operationId: "operation-1" } },
    });

    expect(await stateStore.get(CURRENT_STATE_KEY)).toMatchObject({
      latestAttempt: {
        failure: { payload: { operationId: "operation-1" } },
      },
    });
  });

  test("advances the baseline snapshot with the failed attempt's collected data", async () => {
    const baseline = createMockAppStateSnapshot({
      data: { eventing: { providers: [] } },
      id: "baseline-1",
    });
    const attempt = createMockLifecycleAttempt({ plan });
    const state = createMockOrchestrationState({
      baselineSnapshotId: baseline.id,
      latestAttempt: attempt,
    });
    const stateStore = createMockLifecycleStore({ initial: state });
    const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    const workflow = createMockFailedState({
      data: { eventing: { providers: ["evt-new"] } },
      id: "installation-1",
    });

    const failed = await persistApplyFailure(
      { snapshotStore, stateStore },
      state,
      attempt,
      baseline,
      workflow,
    );

    expect.assert(failed.status === "failed", "Expected a failed attempt");

    const persistedState = await stateStore.get(CURRENT_STATE_KEY);
    expect(persistedState?.baselineSnapshotId).toBeDefined();
    expect(persistedState?.baselineSnapshotId).not.toBe(baseline.id);

    const newSnapshot = await snapshotStore.get(
      persistedState?.baselineSnapshotId as string,
    );
    expect(newSnapshot).toMatchObject({
      config: baseline.config,
      data: { eventing: { providers: ["evt-new"] } },
    });
  });
});

describe("persistSuccess", () => {
  test("captures a new snapshot and points the baseline at it", async () => {
    const attempt = createMockLifecycleAttempt({ plan });
    const state = createMockOrchestrationState({ latestAttempt: attempt });
    const stateStore = createMockLifecycleStore({ initial: state });
    const snapshotStore = createMockLifecycleStore<AppStateSnapshot>();
    const workflow = createMockSucceededState({
      data: { remoteId: "resource-1" },
      id: "installation-1",
    });

    const succeeded = await persistSuccess(
      { snapshotStore, stateStore },
      state,
      attempt,
      workflow,
    );

    expect.assert(
      succeeded.status === "succeeded",
      "Expected a succeeded attempt",
    );

    const { snapshotId } = succeeded.result;
    const snapshot = await snapshotStore.get(snapshotId);
    expect(snapshot).toMatchObject({
      config: plan.target.config,
      data: { remoteId: "resource-1" },
    });

    expect(succeeded.result).toEqual({
      appVersion: "2.0.0",
      snapshotId,
    });

    expect(await stateStore.get(CURRENT_STATE_KEY)).toMatchObject({
      baselineSnapshotId: snapshotId,
      latestAttempt: succeeded,
    });
  });
});
