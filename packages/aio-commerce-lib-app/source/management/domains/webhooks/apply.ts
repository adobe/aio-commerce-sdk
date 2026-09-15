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

import type {
  CommerceWebhook,
  WebhookSubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { WebhooksExecutionContext, WebhooksStepContext } from "./context";
import type {
  ResolvedWebhookPayload,
  WebhookDomainPlan,
  WebhookIdentity,
  WebhookSnapshotData,
} from "./types";

/**
 * Applies add, update, and remove operations while pruning live app-owned
 * webhooks absent from the target. Aborts on the first failure.
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

  let liveIdentities = await pruneStaleWebhooks(
    liveWebhooks,
    desired,
    appConfig.metadata.id,
    context,
  );

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
        const toSubscribe = createSubscribeParams(
          resolvedWebhook,
          requiresAdobeAuth,
          params,
        );

        // biome-ignore lint/performance/noAwaitInLoops: operations must run sequentially so a failure aborts the remaining ones
        await createWebhookSubscription(commerceWebhooksClient, toSubscribe);
        logger.info(`Subscribed webhook: ${getWebhookName(identity)}`);
        liveIdentities = [...liveIdentities, identity];
      }

      if (!isWebhookInList(subscribedWebhooks, identity)) {
        subscribedWebhooks.push(resolvedWebhook);
      }
    } else if (operation.kind === "update") {
      const identity = toIdentity(operation.before);

      // `after` is always fully resolved for `update` (see planWebhookSubscriptions).
      const { requiresAdobeAuth, ...resolvedWebhook } =
        operation.after as ResolvedWebhookPayload;

      // Commerce's subscribe endpoint is a guarded insert, not an upsert — it rejects a
      // still-live identity, so an update must unsubscribe before it can resubscribe.
      if (isWebhookInList(liveIdentities, identity)) {
        await deleteWebhookSubscription(
          commerceWebhooksClient,
          identity,
          identity,
        );
        liveIdentities = liveIdentities.filter(
          (live) => !webhookIdentitiesMatch(live, identity),
        );
      }

      const toSubscribe = createSubscribeParams(
        resolvedWebhook,
        requiresAdobeAuth,
        params,
      );

      await createWebhookSubscription(commerceWebhooksClient, toSubscribe);
      logger.info(`Updated webhook: ${getWebhookName(identity)}`);
      liveIdentities = [...liveIdentities, identity];

      subscribedWebhooks = [
        ...subscribedWebhooks.filter(
          (subscribed) => !webhookIdentitiesMatch(subscribed, identity),
        ),
        resolvedWebhook,
      ];
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

/** Removes live webhooks owned by this app that are absent from the target. */
async function pruneStaleWebhooks(
  liveWebhooks: CommerceWebhook[],
  desiredWebhooks: readonly WebhookIdentity[],
  appId: string,
  context: WebhooksExecutionContext,
): Promise<WebhookIdentity[]> {
  const { commerceWebhooksClient, logger } = context;
  let liveIdentities = liveWebhooks.map(toIdentity);
  const staleWebhooks = liveWebhooks.filter(
    (webhook) =>
      isWebhookOwnedByApp(webhook, appId) &&
      !isDesiredWebhook(webhook, desiredWebhooks),
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
  return liveIdentities;
}

/** Attaches Developer Console credentials when the webhook requires Adobe authentication. */
function createSubscribeParams(
  webhook: WebhookSubscribeParams,
  requiresAdobeAuth: boolean,
  params: Record<string, unknown>,
): WebhookSubscribeParams {
  if (!requiresAdobeAuth) {
    return webhook;
  }

  return {
    ...webhook,
    developer_console_oauth: resolveDeveloperConsoleOAuthCredentials(params),
  };
}
