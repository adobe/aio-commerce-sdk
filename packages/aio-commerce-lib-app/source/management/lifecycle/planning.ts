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
  LifecycleOperation,
  LifecyclePlan,
  LifecyclePlanReview,
  OrchestrationState,
} from "#management/common/orchestration";
import type { PlanningIssue } from "#management/common/workflow/resource";
import type { LifecycleRuntime } from "./state";

/** Warns that a plan without a stored baseline only acts on what the fallback config declares and what can be proven ours. */
const FALLBACK_BASELINE_ISSUE: PlanningIssue = {
  blocking: false,
  code: "PLANNED_WITHOUT_BASELINE",
  domain: "lifecycle",
  message:
    "There is no record of what was installed. The plan only covers what the deployed config declares and what can be proven to belong to the app.",
  severity: "warning",
};

/** Inputs used to produce a lifecycle plan. */
export type PlanLifecycleOptions = LifecycleRuntime & {
  actionVersion: string;
  operation: LifecycleOperation;

  /** The config to plan to, or `null` when nothing should remain installed. */
  targetConfig?: CommerceAppConfigOutputModel | null;

  /** The config to plan from when no baseline is stored. It is not stored as a baseline. */
  fallbackBaselineConfig?: CommerceAppConfigOutputModel;

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

  const { fallbackBaselineConfig } = options;
  const isPlannedFromFallback =
    !baseline && fallbackBaselineConfig !== undefined;

  const planningBaseline = isPlannedFromFallback
    ? { config: fallbackBaselineConfig, data: null }
    : baseline;

  const { targetConfig } = options;
  const target = targetConfig
    ? { appVersion: targetConfig.metadata.version, config: targetConfig }
    : null;

  const planning = await planWorkflow({
    baseline: planningBaseline,
    failedAttempt: getFailedAttempt(state),
    lifecycleContext: options.lifecycleContext,
    rootStep: options.rootStep,
    target,
  });

  const issues = isPlannedFromFallback
    ? [FALLBACK_BASELINE_ISSUE, ...planning.issues]
    : planning.issues;

  const source = baseline
    ? { appVersion: baseline.config.metadata.version, snapshotId: baseline.id }
    : null;

  const plan: LifecyclePlan = {
    actionVersion: options.actionVersion,
    domains: planning.domains,
    id: crypto.randomUUID(),
    issues,
    operation: options.operation,
    source,
    target,
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

/** The target config and domain plans of the latest attempt, when it failed and had a target. */
function getFailedAttempt(state: OrchestrationState) {
  const attempt = state.latestAttempt;
  if (attempt?.status !== "failed" || !attempt.plan.target) {
    return;
  }

  return { config: attempt.plan.target.config, domains: attempt.plan.domains };
}

/** Converts a persisted plan into its public planning result. */
function createPlanningResult(plan: LifecyclePlan): PlanLifecycleResult {
  return plan.issues.some((issue) => issue.blocking)
    ? { kind: "blocked", plan }
    : { kind: "planned", plan };
}
