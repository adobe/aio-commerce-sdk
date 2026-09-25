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

import { planWorkflow } from "#management/common/workflow/plan";

import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
  readOrInitializeState,
} from "./state";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecycleOperation,
  LifecyclePlan,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleRuntime } from "./state";

/** Inputs used to produce a lifecycle plan. */
export type PlanLifecycleOptions = LifecycleRuntime & {
  actionVersion: string;

  /** The configuration to converge to, or `null` to uninstall. */
  targetConfig: CommerceAppConfigOutputModel | null;
};

/** Result of a lifecycle planning pass. */
export type PlanLifecycleResult =
  | { kind: "blocked"; plan: LifecyclePlan; skipped: boolean }
  | { kind: "planned"; plan: LifecyclePlan; skipped: boolean };

/** Produces and persists a plan from the current baseline to the target config. */
export async function planLifecycle(
  options: PlanLifecycleOptions,
): Promise<PlanLifecycleResult> {
  const { baseline, operation, state } = await loadPlanningState(options);

  if (
    state.latestAttempt?.status === "pending" ||
    state.latestAttempt?.status === "in-progress"
  ) {
    throw new Error("A lifecycle attempt is already in progress");
  }

  const existingPlan = findReusablePlan(
    state,
    options.actionVersion,
    operation,
  );
  if (existingPlan) {
    return createPlanningResult(existingPlan, true);
  }

  const planning = await planWorkflow({
    baseline,
    lifecycleContext: options.lifecycleContext,
    rootStep: options.rootStep,
    target: options.targetConfig ? { config: options.targetConfig } : null,
  });

  const plan: LifecyclePlan = {
    actionVersion: options.actionVersion,
    domains: planning.domains,
    id: crypto.randomUUID(),
    issues: planning.issues,
    operation,
    source: baseline
      ? {
          appVersion: baseline.config.metadata.version,
          snapshotId: state.baselineSnapshotId ?? baseline.id,
        }
      : null,
    target: options.targetConfig
      ? {
          appVersion: options.targetConfig.metadata.version,
          config: options.targetConfig,
        }
      : null,
  };

  await options.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    pendingPlan: plan,
  });
  return createPlanningResult(plan, false);
}

/** Loads the normalized state and baseline, and derives the operation they represent. */
async function loadPlanningState(options: PlanLifecycleOptions) {
  const loaded = await readOrInitializeState(options);
  const state = await normalizeExpiredAttempt(options.stateStore, loaded.state);

  const { baseline } = loaded;
  const operation = getLifecycleOperation(baseline, options.targetConfig);

  if (!operation) {
    throw new Error("A lifecycle plan requires a source or target state");
  }

  return { baseline, operation, state };
}

/**
 * Derives the lifecycle operation represented by a nullable baseline and target, or `null` when
 * neither is present.
 */
export function getLifecycleOperation(
  baseline: AppStateSnapshot | null,
  targetConfig: CommerceAppConfigOutputModel | null,
): LifecycleOperation | null {
  if (!baseline) {
    return targetConfig ? "install" : null;
  }

  return targetConfig ? "upgrade" : "uninstall";
}

/** Finds a plan produced by the current action version that can be reused. */
function findReusablePlan(
  state: OrchestrationState,
  actionVersion: string,
  operation: LifecycleOperation,
): LifecyclePlan | null {
  if (
    state.pendingPlan?.actionVersion === actionVersion &&
    state.pendingPlan.operation === operation
  ) {
    return state.pendingPlan;
  }
  const latestPlan = state.latestAttempt?.plan;
  return latestPlan?.actionVersion === actionVersion &&
    latestPlan.operation === operation
    ? latestPlan
    : null;
}

/** Converts a persisted plan into its public planning result. */
function createPlanningResult(
  plan: LifecyclePlan,
  skipped: boolean,
): PlanLifecycleResult {
  return plan.issues.length > 0
    ? { kind: "blocked", plan, skipped }
    : { kind: "planned", plan, skipped };
}
