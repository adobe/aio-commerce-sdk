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
    const attempt = createMockLifecycleAttempt({ plan });
    const state = createMockOrchestrationState({ latestAttempt: attempt });
    const store = createMockLifecycleStore({ initial: state });
    const workflow = createMockFailedState({ id: "installation-1" });

    const failed = await persistApplyFailure(store, state, attempt, workflow);

    expect(failed).toMatchObject({
      failure: {
        key: workflow.error.key,
        message: workflow.error.message,
        path: workflow.error.path,
      },
      status: "failed",
    });

    expect(await store.get(CURRENT_STATE_KEY)).toMatchObject({
      latestAttempt: failed,
    });
  });

  test("preserves the failure payload in the returned and persisted attempt", async () => {
    const attempt = createMockLifecycleAttempt({ plan });
    const state = createMockOrchestrationState({ latestAttempt: attempt });
    const store = createMockLifecycleStore({ initial: state });
    const workflow = createMockFailedState({
      error: {
        key: "STEP_EXECUTION_FAILED",
        message: "Resource update failed",
        path: ["root", "resource"],
        payload: { operationId: "operation-1" },
      },
    });

    const failed = await persistApplyFailure(store, state, attempt, workflow);
    expect(failed).toMatchObject({
      failure: { payload: { operationId: "operation-1" } },
    });

    expect(await store.get(CURRENT_STATE_KEY)).toMatchObject({
      latestAttempt: {
        failure: { payload: { operationId: "operation-1" } },
      },
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
