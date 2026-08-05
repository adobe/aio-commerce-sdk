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

import {
  configHasDestructiveChange,
  configHasUnsupportedChange,
  isEmptyPlan,
} from "#management/upgrade/diff";
import { generatePlanId } from "#management/upgrade/plan-store";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ConfigDiff, UpdatePlan } from "#management/upgrade/types";

/** What the auto path should do with a computed diff (spec §6.2, §4.2). */
export type AutoUpdateDecision =
  | "noop"
  | "unsupported"
  | "review-required"
  | "reconcile";

/**
 * Classifies an auto (unattended) update. Unsupported changes outrank
 * destructive ones: the auto path can neither apply an unsupported change nor
 * hand it to a merchant who could, whereas a destructive-but-supported change
 * is deferred to the manual review flow (spec §4.2).
 */
export function classifyAutoUpdate(diff: ConfigDiff): AutoUpdateDecision {
  if (isEmptyPlan(diff)) {
    return "noop";
  }
  if (configHasUnsupportedChange(diff)) {
    return "unsupported";
  }
  if (configHasDestructiveChange(diff)) {
    return "review-required";
  }
  return "reconcile";
}

/** Builds the inline plan the auto path executes in one pass (spec §6.2 — no stored-plan round-trip). */
export function buildAutoUpdatePlan(
  diff: ConfigDiff,
  targetConfig: CommerceAppConfigOutputModel,
  deploymentVersion: string,
): UpdatePlan {
  return {
    createdAt: new Date().toISOString(),
    deploymentVersion,
    diff,
    planId: generatePlanId(),
    targetConfig,
  };
}
