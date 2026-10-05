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

import stringify from "safe-stable-stringify";

import type {
  LifecyclePlan,
  LifecyclePlanReview,
  ReviewedOperation,
} from "#management/common/orchestration";
import type { ResourceOperation } from "#management/common/workflow/resource";

/** A `change` operation of a plan, with the reference a review reports it under. */
type IndexedOperation = {
  operation: ResourceOperation<unknown>;
  ref: ReviewedOperation;
};

/**
 * Compares the `change` operations of a reviewed plan with those of the plan about to run.
 * `drift` operations are ignored, since the reviewer never sees them.
 *
 * @param reviewed - The plan the reviewer approved.
 * @param current - The plan produced again from the current state.
 */
export function compareWithReviewedPlan(
  reviewed: LifecyclePlan,
  current: LifecyclePlan,
): LifecyclePlanReview {
  const reviewedOperations = indexChangeOperations(reviewed);
  const currentOperations = indexChangeOperations(current);

  const added: ReviewedOperation[] = [];
  const changed: ReviewedOperation[] = [];

  for (const [key, entry] of currentOperations) {
    const reviewedEntry = reviewedOperations.get(key);
    if (!reviewedEntry) {
      added.push(entry.ref);
    } else if (!isSameOperation(reviewedEntry.operation, entry.operation)) {
      changed.push(entry.ref);
    }
  }

  const dropped = [...reviewedOperations]
    .filter(([key]) => !currentOperations.has(key))
    .map(([, entry]) => entry.ref);

  return { added, changed, dropped, planId: reviewed.id };
}

/** Indexes a plan's `change` operations by domain path and operation id. */
function indexChangeOperations(plan: LifecyclePlan) {
  const index = new Map<string, IndexedOperation>();

  for (const domain of plan.domains) {
    for (const operation of domain.operations) {
      if (operation.reason !== "change") {
        continue;
      }

      index.set(`${domain.path.join("/")}:${operation.id}`, {
        operation,
        ref: { id: operation.id, label: operation.label, path: domain.path },
      });
    }
  }

  return index;
}

/** Whether two operations with the same id do the same thing. */
function isSameOperation(
  a: ResourceOperation<unknown>,
  b: ResourceOperation<unknown>,
): boolean {
  const afterA = "after" in a ? a.after : undefined;
  const afterB = "after" in b ? b.after : undefined;

  return a.kind === b.kind && stringify(afterA) === stringify(afterB);
}
