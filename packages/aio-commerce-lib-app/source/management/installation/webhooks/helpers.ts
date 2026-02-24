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

import { hasWebhooks } from "#config/schema/webhooks";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { WebhookDefinition } from "#config/schema/webhooks";
import type { WebhooksExecutionContext } from "./context";

/** Summary of webhook subscription results after a run. */
export type WebhookSubscriptionResult = {
  subscriptionsCreated: number;
  failures: Array<{ hookName: string; error: unknown }>;
};

/**
 * Subscribes each webhook from the app config to Adobe Commerce.
 * Processes all webhooks, collecting failures rather than aborting on the first error.
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
 */
export async function createWebhookSubscriptions(
  config: CommerceAppConfigOutputModel,
  context: WebhooksExecutionContext,
): Promise<WebhookSubscriptionResult> {
  const { logger, commerceWebhooksClient } = context;

  if (!hasWebhooks(config)) {
    logger.info("No webhooks configured, skipping subscription step.");
    return { subscriptionsCreated: 0, failures: [] };
  }

  logger.info(
    `Subscribing ${config.webhooks.length} webhook(s) to Commerce...`,
  );

  let subscriptionsCreated = 0;
  const failures: WebhookSubscriptionResult["failures"] = [];

  for (const entry of config.webhooks) {
    const { description, runtimeAction, webhook } = entry;

    logger.debug(
      `Subscribing webhook "${getWebhookName(webhook)}" (runtimeAction: ${runtimeAction ?? "none"})`,
    );

    try {
      let resolvedUrl = webhook.url;
      if (!resolvedUrl && runtimeAction) {
        resolvedUrl = generateUrlForRuntimeAction(runtimeAction);
      }

      if (!resolvedUrl) {
        throw new Error(
          `Webhook "${description}" must have either a URL or a runtime action defined.`,
        );
      }

      const resolvedWebhook = { ...webhook, url: resolvedUrl };

      await commerceWebhooksClient.subscribeWebhook(resolvedWebhook);
      subscriptionsCreated++;
      logger.info(`Subscribed webhook: ${getWebhookName(webhook)}`);
    } catch (error) {
      logger.error(
        `Failed to subscribe webhook "${getWebhookName(webhook)}": ${String(error)}`,
      );
      failures.push({ hookName: getWebhookName(webhook), error });
    }
  }

  logger.info(
    `Webhook subscriptions complete: ${subscriptionsCreated} created, ${failures.length} failed.`,
  );

  return { subscriptionsCreated, failures };
}

/**
 * Generates a URL for a given runtime action using the AIO Runtime API host and namespace.
 * @param runtimeAction
 * @return The generated URL for the runtime action.
 */
function generateUrlForRuntimeAction(runtimeAction: string): string {
  const namespace = process.env.__OW_NAMESPACE;
  const apiHost = process.env.__OW_API_HOST ?? "https://adobeioruntime.net";

  if (!namespace) {
    return `${apiHost}/api/v1/web/${runtimeAction}`;
  }

  return `https://${namespace}.adobeioruntime.net/api/v1/web/${runtimeAction}`;
}

/**
 * Generates a name for a webhook based on its method and type.
 *
 * @param webhook
 * @return A string in the format "webhook_method:webhook_type" to identify the webhook.
 */
function getWebhookName(webhook: WebhookDefinition): string {
  return `${webhook.webhook_method}:${webhook.webhook_type}`;
}
