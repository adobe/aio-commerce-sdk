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

import { HTTPError } from "@adobe/aio-commerce-lib-api/ky";

import { hasWebhooks } from "#config/schema/webhooks";

import type { WebhookSubscribeParams } from "@adobe/aio-commerce-lib-webhooks";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { WebhookDefinition } from "#config/schema/webhooks";
import type { WebhooksExecutionContext } from "./context";

/** Matches any character that is not a valid identifier character (letter, digit, or underscore). */
const NON_IDENTIFIER_CHAR_REGEX = /[^a-zA-Z0-9_]/g;

/** Matches two or more consecutive underscores. */
const MULTIPLE_UNDERSCORES_REGEX = /_+/g;

/** Summary of webhook subscription results after a run. */
export type WebhookSubscriptionResult = {
  subscribedWebhooks: WebhookSubscribeParams[];
};

/**
 * Subscribes each webhook from the app config to Adobe Commerce.
 * Throws on the first failure, aborting any remaining subscriptions.
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
    return { subscribedWebhooks: [] };
  }

  logger.info(
    `Subscribing ${config.webhooks.length} webhook(s) to Commerce...`,
  );

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const subscribedWebhooks: WebhookSubscribeParams[] = [];

  for (const entry of config.webhooks) {
    const { description, runtimeAction, webhook } = entry;

    logger.debug(
      `Subscribing webhook "${getWebhookName(webhook)}" (runtimeAction: ${runtimeAction ?? "none"})`,
    );

    let resolvedUrl = webhook.url;
    if (!resolvedUrl && runtimeAction) {
      resolvedUrl = generateUrlForRuntimeAction(runtimeAction);
    }

    if (!resolvedUrl) {
      throw new Error(
        `Webhook "${description}" must have either a URL or a runtime action defined.`,
      );
    }

    const resolvedWebhook = {
      ...webhook,
      url: resolvedUrl,
      batch_name: `${idPrefix}${webhook.batch_name}`,
      hook_name: `${idPrefix}${webhook.hook_name}`,
    };

    await subscribeWithEnrichedError(
      commerceWebhooksClient,
      resolvedWebhook,
      webhook,
    );
    subscribedWebhooks.push(resolvedWebhook);
    logger.info(`Subscribed webhook: ${getWebhookName(webhook)}`);
  }

  logger.info(
    `Webhook subscriptions complete: ${subscribedWebhooks.length} subscribed.`,
  );

  return { subscribedWebhooks };
}

/**
 * Calls subscribeWebhook and, if it fails with an HTTPError whose response body
 * contains a string `message`, rethrows as a new Error that includes the webhook
 * name so callers get a human-readable failure reason.
 */
async function subscribeWithEnrichedError(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookSubscribeParams,
  originalWebhook: WebhookDefinition,
): Promise<void> {
  try {
    await client.subscribeWebhook(resolvedWebhook);
  } catch (err) {
    if (err instanceof HTTPError) {
      let body: { message?: unknown } | undefined;
      try {
        body = await err.response.json<{ message?: unknown }>();
      } catch {
        throw err;
      }
      if (typeof body?.message === "string") {
        throw new Error(
          `Webhook subscription failed for "${getWebhookName(originalWebhook)}": ${body.message}`,
        );
      }
    }
    throw err;
  }
}

/**
 * Generates a URL for a given runtime action using the AIO Runtime API host and namespace.
 * @param runtimeAction
 * @return The generated URL for the runtime action.
 */
function generateUrlForRuntimeAction(runtimeAction: string): string {
  const namespace = process.env.__OW_NAMESPACE;

  if (!namespace) {
    throw new Error(
      `Cannot generate URL for runtime action "${runtimeAction}": namespace environment variable is not set.`,
    );
  }

  return `https://${namespace}.adobeioruntime.net/api/v1/web/${runtimeAction}`;
}

/**
 * Builds a prefix string from the app ID to namespace webhook batch/hook names.
 * Non-identifier characters are replaced with underscores; consecutive underscores
 * are collapsed to one; a trailing underscore is appended.
 *
 * @example buildWebhookIdPrefix("my--app.v2") // => "my_app_v2_"
 * @param appId - The app ID to build the prefix from.
 * @return The built prefix string.
 */
function buildWebhookIdPrefix(appId: string): string {
  const prefix = appId
    .replace(NON_IDENTIFIER_CHAR_REGEX, "_")
    .replace(MULTIPLE_UNDERSCORES_REGEX, "_");
  return prefix.endsWith("_") ? prefix : `${prefix}_`;
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
