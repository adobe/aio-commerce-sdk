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

import {
  LifecycleBaselineNotFoundError,
  LifecycleStateNotInitializedError,
  StaleLifecycleAttemptError,
} from "./errors";

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

/**
 * Whether the orchestration state is stored but cannot be read, as when its content is not
 * valid JSON. The store's `get` returns `null` for such a value, as for a missing one.
 *
 * @param store - The orchestration state store.
 */
export async function isOrchestrationStateUnreadable(
  store: Pick<KeyValueStore<OrchestrationState>, "get" | "has">,
): Promise<boolean> {
  const state = await store.get(CURRENT_STATE_KEY);
  return state === null && (await store.has(CURRENT_STATE_KEY));
}

/** Resolves the baseline snapshot selected by orchestration state. */
export type LifecycleBaselineProvider = {
  /** Loads the stored snapshot, or `null` when there is no baseline. */
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

/**
 * Reads the orchestration state and its baseline snapshot. Without stored state, returns an empty
 * state and a `null` baseline, which means nothing is installed.
 */
export async function readOrInitializeState(
  runtime: LifecycleRuntime,
): Promise<{ state: OrchestrationState; baseline: AppStateSnapshot | null }> {
  const existing = await runtime.stateStore.get(CURRENT_STATE_KEY);
  if (!existing) {
    return {
      baseline: null,
      state: {
        baselineSnapshotId: null,
        latestAttempt: null,
        pendingPlan: null,
      },
    };
  }

  if (!existing.baselineSnapshotId) {
    return { baseline: null, state: existing };
  }

  const baseline = await runtime.baselineProvider.get(
    existing.baselineSnapshotId,
  );

  if (!baseline) {
    throw new LifecycleBaselineNotFoundError();
  }

  return { baseline, state: existing };
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
    throw new LifecycleStateNotInitializedError();
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
    throw new StaleLifecycleAttemptError(attemptId);
  }

  return state;
}
