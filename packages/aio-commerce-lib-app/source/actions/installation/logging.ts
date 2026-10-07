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
  LifecycleAttempt,
  LifecyclePlan,
} from "#management/common/orchestration";
import type { PlanningIssue } from "#management/common/workflow/resource";
import type { RequestHandlerArgs } from "./common";

type Logger = RequestHandlerArgs["logger"];

/** Logs what a new plan does, at `info`, and how many operations each domain plans, at `debug`. */
export function logPlan(logger: Logger, plan: LifecyclePlan) {
  const from = plan.source?.appVersion ?? "nothing installed";
  const to = plan.target?.appVersion ?? "nothing installed";
  const replacing = plan.previousPlanId
    ? `, replacing plan ${plan.previousPlanId}`
    : "";

  const issues =
    plan.issues.length > 0
      ? ` (issues: ${formatIssueCodes(plan.issues)})`
      : " with no issues";

  logger.info(
    `Planned ${plan.operation} ${plan.id} from ${from} to ${to}${replacing}${issues}.`,
  );

  const counts = plan.domains.map(
    (domain) => `${domain.operations.length} in ${domain.path.join("/")}`,
  );

  logger.debug(
    counts.length > 0
      ? `Plan ${plan.id} has these operations per domain: ${counts.join(", ")}.`
      : `Plan ${plan.id} has no domains to change.`,
  );
}

/** Logs, at `warn`, the blocking issues of a plan that cannot start. */
export function logBlockedPlan(logger: Logger, plan: LifecyclePlan) {
  const blocking = plan.issues.filter((issue) => issue.blocking);
  logger.warn(
    `The ${plan.operation} plan ${plan.id} is blocked by ${formatIssueCodes(blocking)}.`,
  );
}

/**
 * Logs a started attempt and its dispatched execution, at `info`, and how it differs from the
 * reviewed plan, at `debug`.
 */
export function logAttemptStarted(
  logger: Logger,
  label: string,
  attempt: LifecycleAttempt,
  executionActivationId: string,
) {
  const previous = attempt.previousAttemptId ?? "none";
  logger.info(
    `${label} attempt ${attempt.id} started from plan ${attempt.plan.id} (previous attempt ${previous}), execution dispatched as activation ${executionActivationId}.`,
  );

  if (attempt.review) {
    const { added, changed, dropped, planId } = attempt.review;
    logger.debug(
      `${label} attempt ${attempt.id} differs from the reviewed plan ${planId} by ${added.length} added, ${dropped.length} dropped and ${changed.length} changed operations.`,
    );
  }
}

/** Logs how an executed attempt ended, at `info`, and why it failed, at `error`. */
export function logAttemptEnded(
  logger: Logger,
  label: string,
  attempt: LifecycleAttempt,
  durationMs: number,
) {
  logger.info(
    `${label} attempt ${attempt.id} ended as ${attempt.status} after ${durationMs} ms.`,
  );

  if (attempt.status === "failed") {
    const { key, message, path } = attempt.failure;
    const where = path.length > 0 ? ` at ${path.join("/")}` : "";

    logger.error(
      `${label} attempt ${attempt.id} failed with ${key}${where}: ${message ?? "no message"}`,
    );
  }
}

/** Describes the attempt that blocks a new one, for logs. */
export function describeActiveAttempt(attempt?: LifecycleAttempt | null) {
  return attempt
    ? `the ${attempt.operation} attempt ${attempt.id} is still ${attempt.status}`
    : "another lifecycle operation is in progress";
}

/** The codes of the given issues, with the blocking ones marked. */
function formatIssueCodes(issues: PlanningIssue[]) {
  return issues
    .map((issue) => (issue.blocking ? `${issue.code} (blocking)` : issue.code))
    .join(", ");
}
