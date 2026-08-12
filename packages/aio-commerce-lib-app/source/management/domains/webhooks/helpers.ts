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

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";

import { appliesToEnv, getInstallCommerceEnv } from "#config/lib/environment";

import {
  buildWebhookIdPrefix,
  createWebhookSubscription,
  deleteWebhookSubscription,
  getWebhookName,
  isWebhookInList,
  resolveWebhookSubscribeParams,
} from "./utils";

import type {
  CommerceWebhook,
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type { ValidationIssue } from "#management/common/workflow/step";
import type { WebhooksExecutionContext } from "./context";
import type {
  ConflictingWebhook,
  WebhookSubscriptionResult,
  WebhookUnsubscriptionResult,
} from "./types";

/**
 * Validates that no modification webhooks conflict with webhooks Commerce already has
 * registered for another app (same `webhook_method`/`webhook_type`, different identity).
 * Returns a `WEBHOOK_CONFLICTS` issue listing them, or an empty array otherwise.
 */
export async function validateWebhookConflicts(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<ValidationIssue[]> {
  const { logger, commerceWebhooksClient, params } = context;

  const env = getInstallCommerceEnv(params);
  const modificationWebhooks = config.webhooks.filter(
    (entry) => entry.category === "modification" && appliesToEnv(entry, env),
  );

  if (modificationWebhooks.length === 0) {
    logger.debug(
      "No modification webhooks to validate, skipping conflict check.",
    );
    return [];
  }

  logger.debug(
    `Validating ${modificationWebhooks.length} modification webhook(s) for conflicts...`,
  );

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();
  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const conflictedWebhooks: ConflictingWebhook[] = [];

  for (const entry of modificationWebhooks) {
    const { webhook } = entry;
    const resolvedBatch = `${idPrefix}${webhook.batch_name}`;
    const resolvedHook = `${idPrefix}${webhook.hook_name}`;

    for (const existing of existingWebhooks) {
      if (
        existing.webhook_method === webhook.webhook_method &&
        existing.webhook_type === webhook.webhook_type &&
        !(
          existing.batch_name === resolvedBatch &&
          existing.hook_name === resolvedHook
        )
      ) {
        conflictedWebhooks.push({
          label: entry.label,
          ...existing,
        });
        break;
      }
    }
  }

  if (conflictedWebhooks.length > 0) {
    return [
      {
        code: "WEBHOOK_CONFLICTS",
        details: { conflictedWebhooks },
        message: `Webhook conflicts detected: ${conflictedWebhooks.length} webhook(s) already registered for the same method and type by another app`,
        severity: "warning",
      },
    ];
  }

  logger.info("No webhook conflicts found.");
  return [];
}

/**
 * Subscribes each webhook from the app config to Adobe Commerce.
 * Throws on the first failure, aborting any remaining subscriptions.
 */
export async function createWebhookSubscriptions(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<WebhookSubscriptionResult> {
  const { logger, commerceWebhooksClient, params } = context;

  const env = getInstallCommerceEnv(params);
  const webhooks = config.webhooks.filter((entry) => appliesToEnv(entry, env));

  if (webhooks.length === 0) {
    logger.info(
      "No webhooks apply to this environment, skipping subscription.",
    );
    return { subscribedWebhooks: [] };
  }

  logger.info(`Subscribing ${webhooks.length} webhook(s) to Commerce...`);

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const subscribedWebhooks: WebhookSubscribeParams[] = [];

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();

  for (const entry of webhooks) {
    const { webhook } = entry;

    logger.debug(
      `Subscribing webhook "${getWebhookName(webhook)}" (runtimeAction: ${"runtimeAction" in entry ? entry.runtimeAction : "none"})`,
    );

    const resolvedWebhook = resolveWebhookSubscribeParams(
      entry,
      idPrefix,
      params,
    );

    subscribedWebhooks.push(
      // biome-ignore lint/performance/noAwaitInLoops: subscriptions must be created sequentially so a failure aborts remaining subscriptions (see function docstring)
      await createOrGetWebhookSubscription(
        existingWebhooks,
        commerceWebhooksClient,
        resolvedWebhook,
        logger,
      ),
    );
  }

  logger.info(
    `Webhook subscriptions complete: ${subscribedWebhooks.length} subscribed.`,
  );

  return { subscribedWebhooks };
}

/**
 * Unsubscribes each webhook from the app config in Adobe Commerce.
 * If a webhook is not found in the existing list, it is silently skipped (idempotent).
 */
export async function deleteWebhookSubscriptions(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<WebhookUnsubscriptionResult> {
  const { logger, commerceWebhooksClient } = context;

  logger.info(
    `Unsubscribing ${config.webhooks.length} webhook(s) from Commerce...`,
  );

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();

  const unsubscribedWebhooks: WebhookUnsubscribeParams[] = [];

  for (const entry of config.webhooks) {
    const { webhook } = entry;
    const resolvedBatch = `${idPrefix}${webhook.batch_name}`;
    const resolvedHook = `${idPrefix}${webhook.hook_name}`;

    const params: WebhookUnsubscribeParams = {
      batch_name: resolvedBatch,
      hook_name: resolvedHook,
      webhook_method: webhook.webhook_method,
      webhook_type: webhook.webhook_type,
    };

    if (!isWebhookInList(existingWebhooks, params)) {
      logger.debug(
        `Webhook not found, skipping unsubscribe: ${getWebhookName(webhook)}`,
      );
      continue;
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: unsubscribes hit the Adobe Commerce API sequentially to avoid a rate-limit burst during uninstall
      await deleteWebhookSubscription(commerceWebhooksClient, webhook, params);
      logger.info(`Unsubscribed webhook: ${getWebhookName(webhook)}`);
      unsubscribedWebhooks.push(params);
    } catch (error) {
      logger.warn(`${stringifyError(error)}. Continuing uninstall.`);
    }
  }

  logger.info(
    `Webhook unsubscriptions complete: ${unsubscribedWebhooks.length} unsubscribed.`,
  );

  return { unsubscribedWebhooks };
}

/**
 * Subscribes a single webhook to Commerce, skipping the API call if the webhook
 * is already subscribed (matched by webhook_method, webhook_type, batch_name, hook_name).
 */
export async function createOrGetWebhookSubscription(
  existingWebhooks: CommerceWebhook[],
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookSubscribeParams,
  logger: WebhooksExecutionContext["logger"],
): Promise<WebhookSubscribeParams> {
  if (isWebhookInList(existingWebhooks, resolvedWebhook)) {
    logger.info(
      `Webhook already subscribed, skipping: ${getWebhookName(resolvedWebhook)}`,
    );
    return resolvedWebhook;
  }
  const subscribed = await createWebhookSubscription(client, resolvedWebhook);
  logger.info(`Subscribed webhook: ${getWebhookName(resolvedWebhook)}`);
  return subscribed;
}
