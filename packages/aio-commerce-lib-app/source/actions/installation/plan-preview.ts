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

import type {
  LifecycleOperation,
  LifecyclePlan,
} from "#management/common/orchestration";
import type {
  ItemRef,
  ResourceChange,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationIssueSeverity } from "#management/common/workflow/validation";

/** An operation listed in a plan preview. */
export type PlanPreviewOperation = {
  id: string;
  kind: ResourceOperation<unknown>["kind"];
  label: string;
  reason: ResourceOperation<unknown>["reason"];

  /** The items the operation changes. Empty for an operation internal to its domain. */
  itemRefs: ItemRef[];
};

/** The operations and config changes a plan preview lists for one domain. */
export type PlanPreviewDomain = {
  path: string[];
  operations: PlanPreviewOperation[];

  /**
   * The items the target config adds, updates or removes compared with the installed config,
   * whatever the live state is. Empty for a plan stored by an older version.
   */
  changes: ResourceChange[];
};

/** An issue listed in a plan preview. */
export type PlanPreviewIssue = {
  domain: string;
  code: string;
  message: string;
  path?: string[];
  severity: ValidationIssueSeverity;
  blocking: boolean;
};

/** The plan `POST /plan` returns for review, without internal or sensitive values. */
export type PlanPreview = {
  /** The `planId` to start the plan with. */
  id: string;
  operation: LifecycleOperation;

  /** The app version the plan starts from, or `null` when nothing is installed. */
  sourceVersion: string | null;

  /** The app version the plan ends at, or `null` when the app ends up with nothing installed. */
  targetVersion: string | null;

  /** The domains with operations to run or config changes. A domain with neither is left out. */
  domains: PlanPreviewDomain[];
  issues: PlanPreviewIssue[];
};

/**
 * The preview of a plan, without internal or sensitive values. Plan previews and attempt
 * statuses share it so both show the same plan.
 */
export function toPlanPreview(plan: LifecyclePlan): PlanPreview {
  return {
    domains: plan.domains
      .filter(
        (domain) =>
          domain.operations.length > 0 || (domain.changes?.length ?? 0) > 0,
      )
      .map((domain) => ({
        changes: domain.changes ?? [],
        operations: domain.operations.map(
          ({ id, kind, label, reason, itemRefs }) => ({
            id,
            itemRefs,
            kind,
            label,
            reason,
          }),
        ),
        path: domain.path,
      })),
    id: plan.id,
    issues: plan.issues.map((issue) => ({
      blocking: issue.blocking,
      code: issue.code,
      domain: issue.domain,
      message: issue.message,
      path: issue.path,
      severity: issue.severity ?? "error",
    })),
    operation: plan.operation,
    sourceVersion: plan.source?.appVersion ?? null,
    targetVersion: plan.target?.appVersion ?? null,
  };
}
