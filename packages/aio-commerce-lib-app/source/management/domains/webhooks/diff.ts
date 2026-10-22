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

import { toItemRef } from "#management/common/workflow/resource";

import { hasWebhookConfigChanged } from "./comparison";
import {
  getWebhookName,
  isDesiredWebhook,
  isWebhookInList,
  isWebhookProvenOwnedByApp,
  toIdentity,
  webhookIdentitiesMatch,
  webhookKey,
  webhookOperationId,
} from "./utils";

import type {
  ItemRef,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type {
  ResolvedWebhookPayload,
  WebhookDomainPlan,
  WebhookIdentity,
  WebhookOperationValue,
} from "./types";

/** The item references of the webhooks the baseline and the target config declare, by `webhookKey`. */
type WebhookItemRefs = {
  baseline: ReadonlyMap<string, ItemRef>;
  target: ReadonlyMap<string, ItemRef>;
};

/** The item reference of a webhook, without text when the config does not declare it. */
function itemRefsOf(
  webhook: WebhookIdentity,
  declared: ReadonlyMap<string, ItemRef>,
): ItemRef[] {
  const key = webhookKey(webhook);
  return [declared.get(key) ?? toItemRef("webhook", key)];
}

/** Plans an add for every desired webhook missing from Commerce. */
export function planAdditions(
  live: readonly ResolvedWebhookPayload[],
  desired: readonly ResolvedWebhookPayload[],
  declaredInBaseline: readonly ResolvedWebhookPayload[],
  refs: WebhookItemRefs,
): ResourceOperation<WebhookOperationValue>[] {
  return desired
    .filter((webhook) => !isWebhookInList(live, webhook))
    .map((webhook) => {
      const identity = toIdentity(webhook);
      return {
        after: webhook,
        id: webhookOperationId("add", identity),
        itemRefs: itemRefsOf(webhook, refs.target),
        kind: "add",
        label: `Subscribe webhook: ${getWebhookName(identity)}`,
        reason: isChangedFromBaseline(webhook, declaredInBaseline)
          ? "change"
          : "drift",
      };
    });
}

/** Plans an update for every desired webhook whose live copy differs from it. */
export function planUpdates(
  live: readonly ResolvedWebhookPayload[],
  desired: readonly ResolvedWebhookPayload[],
  declaredInBaseline: readonly ResolvedWebhookPayload[],
  configuredValues: NonNullable<WebhookDomainPlan["configuredValues"]>,
  refs: WebhookItemRefs,
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
      itemRefs: itemRefsOf(webhook, refs.target),
      kind: "update",
      label: `Update webhook: ${getWebhookName(identity)}`,
      reason: isChangedFromBaseline(webhook, declaredInBaseline)
        ? "change"
        : "drift",
    };
  });
}

/** Plans a remove for every live webhook the app owns that is not desired. */
export function planRemovals(
  live: readonly ResolvedWebhookPayload[],
  desired: readonly ResolvedWebhookPayload[],
  declaredInBaseline: readonly ResolvedWebhookPayload[],
  appId: string,
  refs: WebhookItemRefs,
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
        itemRefs: itemRefsOf(webhook, refs.baseline),
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
