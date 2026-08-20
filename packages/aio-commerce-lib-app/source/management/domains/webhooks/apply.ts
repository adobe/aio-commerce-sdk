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
  createWebhookSubscription,
  deleteWebhookSubscription,
  getWebhookName,
  isDesiredWebhook,
  isWebhookInList,
  isWebhookOwnedByApp,
  resolveDesiredWebhooks,
  resolveDeveloperConsoleOAuthCredentials,
  toIdentity,
  webhookIdentitiesMatch,
} from "./utils";

import type { WebhookSubscribeParams } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
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
 * Applies a webhooks domain plan and prunes live app-owned webhooks absent from
 * the target. Aborts on the first failure rather than report partial success.
 */
export async function applyWebhookSubscriptions(
  plan: WebhookDomainPlan,
  context: ApplyContext<
    WebhooksStepContext,
    WebhooksConfig,
    WebhookSnapshotData
  >,
): Promise<ApplyResult<WebhookSnapshotData>> {
  const { logger, commerceWebhooksClient, params } = context;

  const liveWebhooks = await commerceWebhooksClient.getWebhookList();
  let liveIdentities = liveWebhooks.map(toIdentity);

  let subscribedWebhooks: WebhookSubscribeParams[] = [
    ...(context.baseline?.data.subscribedWebhooks ?? []),
  ];

  const appConfig = context.targetConfig ?? context.baseline?.config;
  if (!appConfig) {
    throw new Error(
      "Cannot apply webhook subscriptions without a baseline or target config",
    );
  }

  const env = getInstallCommerceEnv(params);
  const desired = context.targetConfig
    ? resolveDesiredWebhooks(context.targetConfig, env)
    : [];

  const staleWebhooks = liveWebhooks.filter(
    (webhook) =>
      isWebhookOwnedByApp(webhook, appConfig.metadata.id) &&
      !isDesiredWebhook(webhook, desired),
  );

  for (const stale of staleWebhooks) {
    const identity = toIdentity(stale);

    // biome-ignore lint/performance/noAwaitInLoops: removals must run sequentially so a failure aborts the remaining work
    await deleteWebhookSubscription(commerceWebhooksClient, identity, identity);

    logger.info(`Unsubscribed webhook: ${getWebhookName(identity)}`);
    liveIdentities = liveIdentities.filter(
      (live) => !webhookIdentitiesMatch(live, identity),
    );
  }

  for (const operation of plan.operations) {
    if (operation.kind === "add") {
      // `after` is always fully resolved for `add` (see planWebhookSubscriptions).
      const { requiresAdobeAuth, ...resolvedWebhook } =
        operation.after as ResolvedWebhookPayload;
      const identity = toIdentity(resolvedWebhook);

      if (isWebhookInList(liveIdentities, identity)) {
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

      if (!isWebhookInList(subscribedWebhooks, identity)) {
        subscribedWebhooks.push(resolvedWebhook);
      }
    } else if (operation.kind === "remove") {
      const identity = toIdentity(operation.before);

      if (isWebhookInList(liveIdentities, identity)) {
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

      subscribedWebhooks = subscribedWebhooks.filter(
        (subscribed) => !webhookIdentitiesMatch(subscribed, identity),
      );
    }
  }

  return {
    snapshotData: { subscribedWebhooks },
  };
}
