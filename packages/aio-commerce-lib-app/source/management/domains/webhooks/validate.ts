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

import { findConflictingWebhooks, toWebhookConflictIssues } from "./comparison";
import { buildWebhookIdPrefix, isWebhookInList } from "./utils";

import type { WebhooksConfig } from "#config/schema/webhooks";
import type { PlanningInput } from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { ValidationIssue } from "#management/common/workflow/validation";
import type { WebhooksStepContext } from "./context";
import type { WebhookDomainPlan, WebhookSnapshotData } from "./types";

/**
 * Warns about the modification webhooks a plan adds or updates when another app already has a
 * webhook on the same hook point.
 *
 * @param plan - The webhooks domain plan.
 * @param input - The planning input the plan was produced from.
 * @param context - The execution context with the Commerce webhooks client.
 */
export async function validateWebhookSubscriptionsPlan(
  plan: WebhookDomainPlan,
  input: PlanningInput<WebhooksConfig, WebhookSnapshotData>,
  context: ValidationExecutionContext<WebhooksStepContext>,
): Promise<ValidationIssue[]> {
  const { targetConfig } = input;
  if (!targetConfig) {
    return [];
  }

  const changed = plan.operations
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

  if (entries.length === 0) {
    return [];
  }

  const live = await context.commerceWebhooksClient.getWebhookList();
  return toWebhookConflictIssues(
    findConflictingWebhooks(entries, live, idPrefix),
  );
}
