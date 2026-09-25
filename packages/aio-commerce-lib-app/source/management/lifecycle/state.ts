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

import { nowIsoString } from "#management/common/workflow/utils";

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

/** The orchestration state together with the baseline snapshot it points to. */
type LoadedState = {
  state: OrchestrationState;
  baseline: AppStateSnapshot | null;
};

/** Reads orchestration state, or creates it on the app's first lifecycle run. */
export async function readOrInitializeState(
  runtime: LifecycleRuntime,
): Promise<LoadedState> {
  const existing = await runtime.stateStore.get(CURRENT_STATE_KEY);
  return existing
    ? loadStateBaseline(runtime, existing)
    : initializeState(runtime);
}

/** Loads the baseline an existing state points to, or `null` when the app is not installed. */
async function loadStateBaseline(
  runtime: LifecycleRuntime,
  state: OrchestrationState,
): Promise<LoadedState> {
  // A null id covers a fresh app and a completed uninstall alike. Asking the provider with a null
  // id reads the old legacy stored data and returns the corresponding baseline snapshot.
  if (!state.baselineSnapshotId) {
    return { baseline: null, state };
  }

  const baseline = await runtime.baselineProvider.get(state.baselineSnapshotId);
  if (!baseline) {
    throw new Error("The lifecycle baseline snapshot is missing");
  }

  return { baseline, state };
}

/**
 * Creates the first lifecycle state. An app installed before the lifecycle gets its install record
 * copied into the snapshot store as the baseline; any other app starts as not installed.
 */
async function initializeState(
  runtime: LifecycleRuntime,
): Promise<LoadedState> {
  const baseline = await runtime.baselineProvider.get(null);
  if (baseline) {
    await runtime.snapshotStore.put(baseline.id, baseline);
  }

  const state: OrchestrationState = {
    baselineSnapshotId: baseline?.id ?? null,
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
    completedAt: nowIsoString(),
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
