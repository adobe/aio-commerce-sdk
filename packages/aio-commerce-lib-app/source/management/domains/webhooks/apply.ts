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
  createWebhookSubscription,
  deleteWebhookSubscription,
  getWebhookName,
  resolveDeveloperConsoleOAuthCredentials,
  toIdentity,
  webhookIdentitiesMatch,
} from "./utils";

import type { WebhookSubscribeParams } from "@adobe/aio-commerce-lib-webhooks/api";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { WebhooksStepContext } from "./context";
import type {
  ResolvedWebhookPayload,
  WebhookDomainPlan,
  WebhookSnapshotData,
} from "./types";

/**
 * Applies a webhooks domain plan: re-checks live Commerce state before each add/remove
 * (idempotent under retry). Aborts on the first failure rather than report partial success.
 */
export async function applyWebhookSubscriptions(
  plan: WebhookDomainPlan,
  context: ApplyContext<WebhooksStepContext>,
): Promise<ApplyResult<WebhookSnapshotData>> {
  const { logger, commerceWebhooksClient, params } = context;

  let liveIdentities = (await commerceWebhooksClient.getWebhookList()).map(
    toIdentity,
  );

  const subscribedWebhooks: WebhookSubscribeParams[] = [
    ...plan.retainedWebhooks,
  ];

  for (const operation of plan.operations) {
    if (operation.kind === "add") {
      // `after` is always fully resolved for `add` (see planWebhookSubscriptions).
      const { requiresAdobeAuth, ...resolvedWebhook } =
        operation.after as ResolvedWebhookPayload;
      const identity = toIdentity(resolvedWebhook);

      if (
        liveIdentities.some((live) => webhookIdentitiesMatch(live, identity))
      ) {
        logger.info(
          `Webhook already subscribed, skipping: ${getWebhookName(identity)}`,
        );
      } else {
        const toSubscribe: WebhookSubscribeParams = {
          ...resolvedWebhook,
          ...(requiresAdobeAuth && {
            developer_console_oauth:
              resolveDeveloperConsoleOAuthCredentials(params),
          }),
        };

        // biome-ignore lint/performance/noAwaitInLoops: operations must run sequentially so a failure aborts the remaining ones
        await createWebhookSubscription(commerceWebhooksClient, toSubscribe);
        logger.info(`Subscribed webhook: ${getWebhookName(identity)}`);
        liveIdentities = [...liveIdentities, identity];
      }

      subscribedWebhooks.push(resolvedWebhook);
    } else if (operation.kind === "remove") {
      const identity = toIdentity(operation.before);

      if (
        liveIdentities.some((live) => webhookIdentitiesMatch(live, identity))
      ) {
        await deleteWebhookSubscription(
          commerceWebhooksClient,
          identity,
          identity,
        );
        logger.info(`Unsubscribed webhook: ${getWebhookName(identity)}`);
        liveIdentities = liveIdentities.filter(
          (live) => !webhookIdentitiesMatch(live, identity),
        );
      } else {
        logger.debug(
          `Webhook not found, skipping unsubscribe: ${getWebhookName(identity)}`,
        );
      }
    }
  }

  return {
    snapshotData: { subscribedWebhooks },
  };
}
