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

import {
  collectConfiguredValues,
  getWebhookName,
  hasWebhookConfigChanged,
  isDesiredWebhook,
  isWebhookInList,
  isWebhookProvenOwnedByApp,
  resolveDesiredWebhooks,
  toIdentity,
  toResolvedWebhookPayload,
  webhookIdentitiesMatch,
  webhookKey,
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
  ResolvedWebhookPayload,
  WebhookDomainPlan,
  WebhookOperationValue,
  WebhookSnapshotData,
} from "./types";

/**
 * Diffs the live webhooks against the target config into add, update, and remove
 * operations. Removes cover live webhooks the app owns that the target does not
 * declare. Blocks with `WEBHOOK_LIVE_READ_FAILED` if the live webhooks cannot be listed.
 */
export async function planWebhookSubscriptions(
  input: PlanningInput<WebhooksConfig, WebhookSnapshotData>,
  context: ValidationExecutionContext<WebhooksStepContext>,
): Promise<PlanningResult<WebhookDomainPlan>> {
  const { path, baseline, targetConfig, failedAttempt } = input;
  const env = getInstallCommerceEnv(context.params);

  let live: ResolvedWebhookPayload[];
  try {
    const webhooks = await context.commerceWebhooksClient.getWebhookList();
    live = webhooks.map(toResolvedWebhookPayload);
  } catch (error) {
    return {
      issues: [
        {
          code: "WEBHOOK_LIVE_READ_FAILED",
          domain: "webhooks",
          message: `Could not list the live webhooks to plan against: ${await unwrapHttpError(error)}`,
        },
      ],
      kind: "blocked",
    };
  }

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

  return {
    kind: "planned",
    plan: {
      configuredValues,
      operations: [
        // Removes precede adds so a rename never briefly double-registers a hook point.
        ...planRemovals(live, desired, declaredInBaseline, context.appId),
        ...planUpdates(live, desired, declaredInBaseline, configuredValues),
        ...planAdditions(live, desired, declaredInBaseline),
      ],
      path,
    },
  };
}

/** Plans an add for every desired webhook missing from Commerce. */
function planAdditions(
  live: readonly ResolvedWebhookPayload[],
  desired: readonly ResolvedWebhookPayload[],
  declaredInBaseline: readonly ResolvedWebhookPayload[],
): ResourceOperation<WebhookOperationValue>[] {
  return desired
    .filter((webhook) => !isWebhookInList(live, webhook))
    .map((webhook) => {
      const identity = toIdentity(webhook);
      return {
        after: webhook,
        id: webhookOperationId("add", identity),
        kind: "add",
        label: `Subscribe webhook: ${getWebhookName(identity)}`,
        reason: isChangedFromBaseline(webhook, declaredInBaseline)
          ? "change"
          : "drift",
      };
    });
}

/** Plans an update for every desired webhook whose live copy differs from it. */
function planUpdates(
  live: readonly ResolvedWebhookPayload[],
  desired: readonly ResolvedWebhookPayload[],
  declaredInBaseline: readonly ResolvedWebhookPayload[],
  configuredValues: NonNullable<WebhookDomainPlan["configuredValues"]>,
): ResourceOperation<WebhookOperationValue>[] {
  return desired.flatMap((webhook) => {
    const current = live.find((candidate) =>
      webhookIdentitiesMatch(candidate, webhook),
    );

    if (!current) {
      return [];
    }

    const configured = configuredValues[webhookKey(webhook)];
    if (!hasWebhookConfigChanged(current, webhook, configured)) {
      return [];
    }

    const identity = toIdentity(webhook);
    return {
      after: webhook,
      before: current,
      id: webhookOperationId("update", identity),
      kind: "update",
      label: `Update webhook: ${getWebhookName(identity)}`,
      reason: isChangedFromBaseline(webhook, declaredInBaseline)
        ? "change"
        : "drift",
    };
  });
}

/** Plans a remove for every live webhook the app owns that is not desired. */
function planRemovals(
  live: readonly ResolvedWebhookPayload[],
  desired: readonly ResolvedWebhookPayload[],
  declaredInBaseline: readonly ResolvedWebhookPayload[],
  appId: string,
): ResourceOperation<WebhookOperationValue>[] {
  return live
    .filter((webhook) => {
      // The baseline also covers webhooks with an explicit url, which are never proven-owned.
      const isOwned =
        isWebhookInList(declaredInBaseline, webhook) ||
        isWebhookProvenOwnedByApp(webhook, appId);

      const isDesired = isDesiredWebhook(webhook, desired);
      return isOwned && !isDesired;
    })
    .map((webhook) => {
      const identity = toIdentity(webhook);
      return {
        before: webhook,
        id: webhookOperationId("remove", identity),
        kind: "remove",
        label: `Unsubscribe webhook: ${getWebhookName(identity)}`,
        reason: isWebhookInList(declaredInBaseline, webhook)
          ? "change"
          : "drift",
      };
    });
}

/** Whether the target config adds or changes a webhook compared with the baseline config. */
function isChangedFromBaseline(
  webhook: ResolvedWebhookPayload,
  declaredInBaseline: readonly ResolvedWebhookPayload[],
): boolean {
  const declared = declaredInBaseline.find((candidate) =>
    webhookIdentitiesMatch(candidate, webhook),
  );

  if (!declared) {
    return true;
  }

  // The baseline is its own evidence, so a field the target drops counts as changed.
  return hasWebhookConfigChanged(declared, webhook, [declared]);
}
