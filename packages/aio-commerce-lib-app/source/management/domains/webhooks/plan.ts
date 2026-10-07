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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import { getInstallCommerceEnv } from "#config/lib/environment";

import { findConflictingWebhooks, toWebhookConflictIssues } from "./comparison";
import { planAdditions, planRemovals, planUpdates } from "./diff";
import {
  buildWebhookIdPrefix,
  collectConfiguredValues,
  isWebhookInList,
  resolveDesiredWebhooks,
  toResolvedWebhookPayload,
} from "./utils";

import type { CommerceWebhook } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type {
  NonBlockingPlanningIssue,
  PlanningInput,
  PlanningResult,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { WebhooksStepContext } from "./context";
import type { WebhookDomainPlan, WebhookSnapshotData } from "./types";

/**
 * Diffs the live webhooks against the target config into add, update, and remove
 * operations. Removes cover live webhooks the app owns that the target does not
 * declare. Blocks with `WEBHOOK_LIVE_READ_FAILED` if the live webhooks cannot be listed, and
 * warns with `WEBHOOK_CONFLICTS` when another app has a webhook on a hook point the plan changes.
 */
export async function planWebhookSubscriptions(
  input: PlanningInput<WebhooksConfig, WebhookSnapshotData>,
  context: ValidationExecutionContext<WebhooksStepContext>,
): Promise<PlanningResult<WebhookDomainPlan>> {
  const { path, baseline, targetConfig, failedAttempt } = input;
  const env = getInstallCommerceEnv(context.params);

  let webhooks: CommerceWebhook[];
  try {
    webhooks = await context.commerceWebhooksClient.getWebhookList();
  } catch (error) {
    return {
      issues: [
        {
          blocking: true,
          code: "WEBHOOK_LIVE_READ_FAILED",
          domain: "webhooks",
          message: `Could not list the live webhooks to plan against: ${await unwrapHttpError(error)}`,
        },
      ],
      kind: "blocked",
    };
  }

  const live = webhooks.map(toResolvedWebhookPayload);
  const desired = targetConfig ? resolveDesiredWebhooks(targetConfig, env) : [];
  const declaredInBaseline = baseline
    ? resolveDesiredWebhooks(baseline.config, env)
    : [];

  const failedPlan = failedAttempt?.plan as WebhookDomainPlan | null;
  const declaredInFailedAttempt = failedAttempt?.targetConfig
    ? resolveDesiredWebhooks(failedAttempt.targetConfig, env)
    : [];

  const configuredValues = collectConfiguredValues(
    [...declaredInBaseline, ...declaredInFailedAttempt],
    { ...failedPlan?.configuredValues },
  );

  const operations = [
    // Removes precede adds so a rename never briefly double-registers a hook point.
    ...planRemovals(live, desired, declaredInBaseline, context.appId),
    ...planUpdates(live, desired, declaredInBaseline, configuredValues),
    ...planAdditions(live, desired, declaredInBaseline),
  ];

  return {
    issues: findConflictIssues(targetConfig, operations, webhooks),
    kind: "planned",
    plan: { configuredValues, operations, path },
  };
}

/**
 * Warns about the modification webhooks the plan adds or updates when another app already has a
 * webhook on the same hook point.
 */
function findConflictIssues(
  targetConfig: WebhooksConfig | null,
  operations: WebhookDomainPlan["operations"],
  webhooks: CommerceWebhook[],
): NonBlockingPlanningIssue[] {
  if (!targetConfig) {
    return [];
  }

  const changed = operations
    .filter((op) => op.kind !== "remove")
    .map((op) => op.after);

  const idPrefix = buildWebhookIdPrefix(targetConfig.metadata.id);
  const entries = targetConfig.webhooks.filter((entry) => {
    const { webhook } = entry;

    const isModification = entry.category === "modification";
    const isChanged = isWebhookInList(changed, {
      batch_name: `${idPrefix}${webhook.batch_name}`,
      hook_name: `${idPrefix}${webhook.hook_name}`,
      webhook_method: webhook.webhook_method,
      webhook_type: webhook.webhook_type,
    });

    return isModification && isChanged;
  });

  const conflicts = findConflictingWebhooks(entries, webhooks, idPrefix);
  return toWebhookConflictIssues(conflicts).map((issue) => ({
    ...issue,
    blocking: false,
    domain: "webhooks",
  }));
}
