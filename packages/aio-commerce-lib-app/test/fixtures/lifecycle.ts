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

import { vi } from "vitest";

import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";
import { minimalValidConfig } from "#test/fixtures/config";
import { createMockInstallationContextWithScripts } from "#test/fixtures/installation";
import {
  createMockLifecycleRoot,
  createMockStepStatus,
} from "#test/fixtures/workflow";

import type {
  AppStateSnapshot,
  LifecycleAttempt,
  LifecyclePlan,
  OrchestrationState,
  SuccessfulResult,
} from "#management/common/orchestration";
import type { WorkflowError } from "#management/common/workflow/types";
import type {
  LifecycleRuntime,
  LifecycleStore,
} from "#management/lifecycle/state";

const DEFAULT_DEADLINE = "2999-01-01T00:00:00.000Z";

/** Creates an in-memory lifecycle store with observable reads and writes. */
export function createMockLifecycleStore<T>(options?: {
  initial?: T;
  onPut?: (key: string, value: T) => void;
}): LifecycleStore<T> & {
  delete: (key: string) => Promise<boolean>;
  values: Map<string, T>;
} {
  const values = new Map<string, T>();
  if (options?.initial !== undefined) {
    values.set(CURRENT_STATE_KEY, options.initial);
  }

  return {
    delete: vi.fn(async (key: string) => values.delete(key)),
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    put: vi.fn(async (key: string, value: T) => {
      options?.onPut?.(key, value);
      values.set(key, value);
    }),
    values,
  };
}

/** Creates a lifecycle plan with stable defaults. */
export function createMockLifecyclePlan(
  overrides?: Partial<LifecyclePlan>,
): LifecyclePlan {
  return {
    actionVersion: "1.0.0",
    domains: [],
    id: "plan-1",
    issues: [],
    operation: "upgrade",
    source: { appVersion: "1.0.0", snapshotId: "snapshot-1" },
    target: {
      appVersion: "2.0.0",
      config: {
        ...minimalValidConfig,
        metadata: { ...minimalValidConfig.metadata, version: "2.0.0" },
      },
    },
    ...overrides,
  };
}

type LifecycleAttemptOverrides = Partial<{
  data: LifecycleAttempt["data"];
  executionDeadline: string;
  failure: WorkflowError<{ operationId?: string }>;
  id: string;
  operation: LifecycleAttempt["operation"];
  plan: LifecyclePlan;
  progress: LifecycleAttempt["progress"];
  result: SuccessfulResult;
  startedAt: string;
  status: LifecycleAttempt["status"];
}>;

/** Creates a lifecycle attempt with status-appropriate result data. */
export function createMockLifecycleAttempt(
  overrides: LifecycleAttemptOverrides = {},
): LifecycleAttempt {
  const base = {
    data: overrides.data ?? null,
    executionDeadline: overrides.executionDeadline ?? DEFAULT_DEADLINE,
    id: overrides.id ?? "attempt-1",
    operation: overrides.operation ?? "upgrade",
    plan: overrides.plan ?? createMockLifecyclePlan(),
    progress: overrides.progress ?? createMockStepStatus(),
    startedAt: overrides.startedAt ?? "2026-08-12T09:00:00.000Z",
  };

  if (overrides.status === "succeeded") {
    return {
      ...base,
      result: overrides.result ?? {
        appVersion: "2.0.0",
        snapshotId: "snapshot-2",
      },
      status: "succeeded",
    };
  }

  if (overrides.status === "failed") {
    return {
      ...base,
      failure: overrides.failure ?? {
        key: "LIFECYCLE_ATTEMPT_FAILED",
        message: "Lifecycle attempt failed",
        path: [],
      },
      status: "failed",
    };
  }

  return {
    ...base,
    status: overrides.status ?? "pending",
  };
}

/** Creates orchestration state with stable defaults. */
export function createMockOrchestrationState(
  overrides?: Partial<OrchestrationState>,
): OrchestrationState {
  return {
    baselineSnapshotId: "snapshot-1",
    latestAttempt: null,
    pendingPlan: null,
    ...overrides,
  };
}

/** Creates an app-state snapshot with stable defaults. */
export function createMockAppStateSnapshot(
  overrides?: Partial<AppStateSnapshot>,
): AppStateSnapshot {
  return {
    config: minimalValidConfig,
    createdAt: "2026-08-12T08:00:00.000Z",
    data: null,
    id: "snapshot-1",
    ...overrides,
  };
}

/** Creates an in-memory lifecycle runtime backed by the real baseline provider. */
export function createMockLifecycleRuntime(options?: {
  baseline?: AppStateSnapshot | null;
  baselineProvider?: LifecycleRuntime["baselineProvider"];
  rootStep?: LifecycleRuntime["rootStep"];
  snapshotStore?: ReturnType<typeof createMockLifecycleStore<AppStateSnapshot>>;
  stateStore?: LifecycleStore<OrchestrationState> & {
    delete: (key: string) => Promise<boolean>;
    values: Map<string, OrchestrationState>;
  };
}) {
  const snapshotStore =
    options?.snapshotStore ?? createMockLifecycleStore<AppStateSnapshot>();
  const stateStore =
    options?.stateStore ?? createMockLifecycleStore<OrchestrationState>();

  const baseline =
    // baseline can be null and we want to preserve that.
    options?.baseline === undefined
      ? createMockAppStateSnapshot()
      : options.baseline;

  const runtime: LifecycleRuntime = {
    baselineProvider:
      options?.baselineProvider ??
      createLifecycleBaselineProvider(snapshotStore, {
        get: async () => baseline,
      }),
    lifecycleContext: createMockInstallationContextWithScripts(),
    rootStep: options?.rootStep ?? createMockLifecycleRoot(),
    snapshotStore,
    stateStore,
  };

  return { runtime, snapshotStore, stateStore };
}
