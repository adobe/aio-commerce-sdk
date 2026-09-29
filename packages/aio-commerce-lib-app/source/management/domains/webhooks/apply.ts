import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  getWebhookName,
  isWebhookInList,
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

/** Applies the planned add, update, and remove operations. Aborts on the first failure. */
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

  let liveIdentities = liveWebhooks.map(toIdentity);

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
