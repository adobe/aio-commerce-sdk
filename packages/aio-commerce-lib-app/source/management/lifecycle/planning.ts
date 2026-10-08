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
  LifecycleAttemptInProgressError,
  PendingLifecyclePlanNotFoundError,
} from "./errors";
import { compareWithReviewedPlan } from "./review";
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
  LifecyclePlanReview,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleRuntime } from "./state";

/** Inputs used to produce a lifecycle plan. */
export type PlanLifecycleOptions = LifecycleRuntime & {
  actionVersion: string;
  operation: LifecycleOperation;
  targetAppVersion: string;
  targetConfig: CommerceAppConfigOutputModel;

  /** Identifier of the pending plan a reviewer approved, to compare the new plan against. */
  reviewedPlanId?: string;
};

/** Result of a lifecycle planning pass. */
export type PlanLifecycleResult = (
  | { kind: "blocked"; plan: LifecyclePlan }
  | { kind: "planned"; plan: LifecyclePlan }
) & {
  /** How the new plan differs from the reviewed one, when `reviewedPlanId` was given. */
  review?: LifecyclePlanReview;
};

/**
 * Produces and persists a plan from the current baseline to the target config, replacing any
 * pending plan. Throws {@link PendingLifecyclePlanNotFoundError} when `reviewedPlanId` is not
 * the pending plan.
 */
export async function planLifecycle(
  options: PlanLifecycleOptions,
): Promise<PlanLifecycleResult> {
  const loaded = await readOrInitializeState(options);
  const state = await normalizeExpiredAttempt(options.stateStore, loaded.state);
  const { baseline } = loaded;

  if (
    state.latestAttempt?.status === "pending" ||
    state.latestAttempt?.status === "in-progress"
  ) {
    throw new LifecycleAttemptInProgressError();
  }

  const reviewedPlan = options.reviewedPlanId
    ? requirePendingPlan(state, options.reviewedPlanId)
    : null;

  const failedPlan =
    state.latestAttempt?.status === "failed" ? state.latestAttempt.plan : null;

  const planning = await planWorkflow({
    baseline,
    failedAttempt: failedPlan
      ? { config: failedPlan.target.config, domains: failedPlan.domains }
      : undefined,
    lifecycleContext: options.lifecycleContext,
    rootStep: options.rootStep,
    target: {
      config: options.targetConfig,
    },
  });

  const plan: LifecyclePlan = {
    actionVersion: options.actionVersion,
    domains: planning.domains,
    id: crypto.randomUUID(),
    issues: planning.issues,
    operation: options.operation,
    source: {
      appVersion: getBaselineAppVersion(state, baseline),
      snapshotId: state.baselineSnapshotId ?? baseline.id,
    },
    target: {
      appVersion: options.targetAppVersion,
      config: options.targetConfig,
    },
  };

  await options.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    pendingPlan: plan,
  });

  const result = createPlanningResult(plan);
  return reviewedPlan
    ? { ...result, review: compareWithReviewedPlan(reviewedPlan, plan) }
    : result;
}

/** Returns the pending plan, or throws when it is not the plan with the given id. */
function requirePendingPlan(
  state: OrchestrationState,
  planId: string,
): LifecyclePlan {
  const plan = state.pendingPlan;
  if (!plan || plan.id !== planId) {
    throw new PendingLifecyclePlanNotFoundError(planId);
  }

  return plan;
}

/** Resolves the version of the app represented by the current baseline. */
function getBaselineAppVersion(
  state: OrchestrationState,
  baseline: AppStateSnapshot,
): string {
  if (state.latestAttempt?.status === "succeeded") {
    return state.latestAttempt.result.appVersion;
  }
  return (
    (baseline.config as { metadata?: { version?: string } }).metadata
      ?.version ?? "0.0.0"
  );
}

/** Converts a persisted plan into its public planning result. */
function createPlanningResult(plan: LifecyclePlan): PlanLifecycleResult {
  return plan.issues.length > 0
    ? { kind: "blocked", plan }
    : { kind: "planned", plan };
}
