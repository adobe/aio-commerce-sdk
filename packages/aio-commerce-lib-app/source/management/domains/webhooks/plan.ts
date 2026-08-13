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

import { getInstallCommerceEnv } from "#config/lib/environment";

import {
  getWebhookName,
  hasWebhookConfigChanged,
  isDesiredWebhook,
  resolveDesiredWebhooks,
  toIdentity,
  webhookIdentitiesMatch,
  webhookOperationId,
} from "./utils";

import type { WebhooksConfig } from "#config/schema/webhooks";
import type {
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { WebhooksStepContext } from "./context";
import type {
  WebhookDomainPlan,
  WebhookOperationValue,
  WebhookSnapshotData,
} from "./types";

/**
 * Diffs the target config against the baseline into add, update, and remove
 * operations. Pure — no external reads or writes, since an observation made
 * here could be stale by execution time. Blocks with
 * `WEBHOOK_BASELINE_UNRESOLVED` if the baseline data cannot be resolved.
 */
export function planWebhookSubscriptions(
  input: PlanningInput<WebhooksConfig, WebhookSnapshotData>,
  context: ValidationExecutionContext<WebhooksStepContext>,
): Promise<PlanningResult<WebhookDomainPlan>> {
  const { path, baseline, targetConfig } = input;
  const { params } = context;

  // An existing baseline with unresolved data isn't "no prior state" — webhooks may
  // still be live, so don't silently drop their removal.
  // biome-ignore lint/suspicious/noUnnecessaryConditions: data can still be null/undefined at runtime despite the type
  if (baseline && !baseline.data?.subscribedWebhooks) {
    return Promise.resolve({
      issues: [
        {
          code: "WEBHOOK_BASELINE_UNRESOLVED",
          domain: "webhooks",
          message:
            "A prior webhooks baseline exists, but its subscribed-webhooks data could not be resolved. Refusing to plan without it, since previously subscribed webhooks could otherwise go unremoved.",
        },
      ],
      kind: "blocked",
    });
  }

  const env = getInstallCommerceEnv(params);
  const desired = targetConfig ? resolveDesiredWebhooks(targetConfig, env) : [];

  const ownedFromBaseline = baseline?.data?.subscribedWebhooks ?? [];

  // Removes precede adds (see the concat below) so a rename never briefly double-registers a hook point.
  const addOperations: ResourceOperation<WebhookOperationValue>[] = [];
  const updateOperations: ResourceOperation<WebhookOperationValue>[] = [];
  const removeOperations: ResourceOperation<WebhookOperationValue>[] = [];

  for (const webhook of desired) {
    const owned = ownedFromBaseline.find((candidate) =>
      webhookIdentitiesMatch(candidate, webhook),
    );

    if (owned) {
      if (hasWebhookConfigChanged(owned, webhook)) {
        const identity = toIdentity(webhook);
        updateOperations.push({
          after: webhook,
          before: identity,
          id: webhookOperationId("update", identity),
          kind: "update",
          label: `Update webhook: ${getWebhookName(identity)}`,
        });
      }
      continue;
    }

    const identity = toIdentity(webhook);
    addOperations.push({
      after: webhook,
      id: webhookOperationId("add", identity),
      kind: "add",
      label: `Subscribe webhook: ${getWebhookName(identity)}`,
    });
  }

  const staleFromBaseline = ownedFromBaseline.filter(
    (owned) => !isDesiredWebhook(owned, desired),
  );

  for (const stale of staleFromBaseline) {
    const identity = toIdentity(stale);
    removeOperations.push({
      before: identity,
      id: webhookOperationId("remove", identity),
      kind: "remove",
      label: `Unsubscribe webhook: ${getWebhookName(identity)}`,
    });
  }

  return Promise.resolve({
    kind: "planned",
    plan: {
      operations: [...removeOperations, ...updateOperations, ...addOperations],
      path,
    },
  });
}
