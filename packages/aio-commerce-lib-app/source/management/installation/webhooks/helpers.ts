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
      `Subscribing webhook "${description}" (runtimeAction: ${runtimeAction}) — method: ${webhook.webhook_method}`,
    );

    try {
      const resolvedWebhook = {
        ...webhook,
        url: webhook.url ?? generateUrlForRuntimeAction(runtimeAction),
      };

      await commerceWebhooksClient.subscribeWebhook(resolvedWebhook);
      subscriptionsCreated++;
      logger.info(
        `Subscribed webhook: ${webhook.hook_name} (${webhook.webhook_method})`,
      );
    } catch (error) {
      logger.error(
        `Failed to subscribe webhook "${webhook.hook_name}": ${String(error)}`,
      );
      failures.push({ hookName: webhook.hook_name, error });
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
  const namespace = process.env.AIO_RUNTIME_NAMESPACE;
  const apiHost =
    process.env.AIO_RUNTIME_APIHOST ?? "https://adobeioruntime.net";

  return `${apiHost}/api/v1/web/${namespace}/${runtimeAction}`;
}
