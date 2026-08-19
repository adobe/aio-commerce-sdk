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

import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type {
  AppStateSnapshot,
  LifecycleAttempt,
  OrchestrationState,
} from "#management/common/orchestration";
import type {
  BranchStep,
  LifecycleContext,
} from "#management/common/workflow/step";

export const CURRENT_STATE_KEY = "current";

/** Minimal persistence contract required by lifecycle orchestration. */
export type LifecycleStore<T> = Pick<KeyValueStore<T>, "get" | "put">;

/** Resolves the selected baseline, including any compatibility fallback. */
export type LifecycleBaselineProvider = {
  /** Loads a stored snapshot, or resolves the baseline when its ID is `null`. */
  get: (snapshotId: string | null) => Promise<AppStateSnapshot | null>;
};

/** Dependencies shared by lifecycle orchestration operations. */
export type LifecycleRuntime = {
  rootStep: BranchStep;
  lifecycleContext: LifecycleContext;
  stateStore: LifecycleStore<OrchestrationState>;
  snapshotStore: LifecycleStore<AppStateSnapshot>;
  baselineProvider: LifecycleBaselineProvider;
};

/** Reads orchestration state and initializes its baseline snapshot if needed. */
export async function readOrInitializeState(
  runtime: LifecycleRuntime,
): Promise<{ state: OrchestrationState; baseline: AppStateSnapshot }> {
  const existing = await runtime.stateStore.get(CURRENT_STATE_KEY);
  if (existing) {
    const baseline = await runtime.baselineProvider.get(
      existing.baselineSnapshotId,
    );

    if (!baseline) {
      throw new Error("The lifecycle baseline snapshot is missing");
    }

    if (existing.baselineSnapshotId) {
      return { baseline, state: existing };
    }

    const initialized = { ...existing, baselineSnapshotId: baseline.id };
    await runtime.snapshotStore.put(baseline.id, baseline);
    await runtime.stateStore.put(CURRENT_STATE_KEY, initialized);

    return { baseline, state: initialized };
  }

  const baseline = await runtime.baselineProvider.get(null);

  if (!baseline) {
    throw new Error("A compatible lifecycle baseline is required");
  }

  await runtime.snapshotStore.put(baseline.id, baseline);
  const state: OrchestrationState = {
    baselineSnapshotId: baseline.id,
    latestAttempt: null,
    pendingPlan: null,
  };

  await runtime.stateStore.put(CURRENT_STATE_KEY, state);
  return { baseline, state };
}

/** Persists an expired active attempt as failed before returning state. */
export async function normalizeExpiredAttempt(
  store: LifecycleStore<OrchestrationState>,
  state: OrchestrationState,
): Promise<OrchestrationState> {
  const attempt = state.latestAttempt;
  if (
    !attempt ||
    (attempt.status !== "pending" && attempt.status !== "in-progress") ||
    Date.parse(attempt.executionDeadline) > Date.now()
  ) {
    return state;
  }

  const failed: LifecycleAttempt = {
    ...attempt,
    failure: {
      key: "LIFECYCLE_ATTEMPT_EXPIRED",
      message: "The lifecycle attempt exceeded its execution deadline",
      path: [],
    },
    status: "failed",
  };

  const normalized = { ...state, latestAttempt: failed };
  await store.put(CURRENT_STATE_KEY, normalized);

  return normalized;
}

/** Loads the current orchestration state or fails when it is uninitialized. */
export async function requireState(
  store: LifecycleStore<OrchestrationState>,
): Promise<OrchestrationState> {
  const state = await store.get(CURRENT_STATE_KEY);
  if (!state) {
    throw new Error("Lifecycle orchestration state has not been initialized");
  }

  return state;
}

/** Returns the active attempt state when its ID and deadline are still valid. */
export async function requireCurrentAttempt(
  store: LifecycleStore<OrchestrationState>,
  attemptId: string,
): Promise<OrchestrationState> {
  const state = await requireState(store);

  if (
    state.latestAttempt?.id !== attemptId ||
    (state.latestAttempt.status !== "pending" &&
      state.latestAttempt.status !== "in-progress") ||
    Date.parse(state.latestAttempt.executionDeadline) <= Date.now()
  ) {
    throw new Error("The lifecycle attempt is stale");
  }

  return state;
}
