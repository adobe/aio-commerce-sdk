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

import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import { HTTPError } from "ky";

import type {
  CommerceWebhook,
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type {
  WebhookDefinition,
  WebhooksConfig,
} from "#config/schema/webhooks";
import type { ValidationIssue } from "#management/installation/workflow/step";
import type { WebhooksExecutionContext } from "./context";

/** Identity of a Commerce webhook that conflicts with a modification webhook from this app. */
export type ConflictingWebhook = {
  label: string;
  webhook_method: string;
  webhook_type: string;
  batch_name: string;
  hook_name: string;
};

/** Matches any character that is not a valid identifier character (letter, digit, or underscore). */
const NON_IDENTIFIER_CHAR_REGEX = /[^a-zA-Z0-9_]/g;

/** Matches two or more consecutive underscores. */
const MULTIPLE_UNDERSCORES_REGEX = /_+/g;

/** Matches the `.magento` segment in plugin webhook method names (e.g. `plugin.magento.foo`). */
const PLUGIN_MAGENTO_REGEX = /^plugin\.magento\./;

const ENVIRONMENT_PRODUCTION = "production";
const ENVIRONMENT_STAGING = "staging";

/** Summary of webhook subscription results after a run. */
export type WebhookSubscriptionResult = {
  subscribedWebhooks: WebhookSubscribeParams[];
};

/** Summary of webhook unsubscription results after a run. */
export type WebhookUnsubscriptionResult = {
  unsubscribedWebhooks: WebhookUnsubscribeParams[];
};

/**
 * Validates that no modification webhooks in the app config conflict with webhooks
 * already registered in Commerce by another app.
 *
 * A conflict is: Commerce has a webhook with the same `webhook_method` and `webhook_type`
 * that does NOT belong to this app (i.e. different `batch_name` or `hook_name` after prefix).
 *
 * Returns a `ValidationIssue` with code `WEBHOOK_CONFLICTS` and `details.conflictedWebhooks` listing
 * every conflicting Commerce webhook when conflicts are found, or an empty array otherwise.
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
 */
export async function validateWebhookConflicts(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<ValidationIssue[]> {
  const { logger, commerceWebhooksClient } = context;

  const modificationWebhooks = config.webhooks.filter(
    (entry) => entry.category === "modification",
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
        message: `Webhook conflicts detected: ${conflictedWebhooks.length} webhook(s) already registered for the same method and type by another app`,
        severity: "warning",
        details: { conflictedWebhooks },
      },
    ];
  }

  logger.info("No webhook conflicts found.");
  return [];
}

/**
 * Subscribes each webhook from the app config to Adobe Commerce.
 * Throws on the first failure, aborting any remaining subscriptions.
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
 */
export async function createWebhookSubscriptions(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<WebhookSubscriptionResult> {
  const { logger, commerceWebhooksClient, params } = context;

  logger.info(
    `Subscribing ${config.webhooks.length} webhook(s) to Commerce...`,
  );

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const subscribedWebhooks: WebhookSubscribeParams[] = [];

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();

  for (const entry of config.webhooks) {
    const { webhook } = entry;
    const resolvedUrl =
      "runtimeAction" in entry
        ? generateUrlForRuntimeAction(entry.runtimeAction)
        : entry.webhook.url;

    logger.debug(
      `Subscribing webhook "${getWebhookName(webhook)}" (runtimeAction: ${"runtimeAction" in entry ? entry.runtimeAction : "none"})`,
    );

    const resolvedWebhook = {
      ...webhook,
      url: resolvedUrl,
      batch_name: `${idPrefix}${webhook.batch_name}`,
      hook_name: `${idPrefix}${webhook.hook_name}`,
      ...("runtimeAction" in entry &&
        entry.requireAdobeAuth !== false && {
          developer_console_oauth:
            resolveDeveloperConsoleOAuthCredentials(params),
        }),
    };

    subscribedWebhooks.push(
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
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
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
  const unsubscribedWebhooks: WebhookUnsubscribeParams[] = [];

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();

  for (const entry of config.webhooks) {
    const { webhook } = entry;
    const resolvedBatch = `${idPrefix}${webhook.batch_name}`;
    const resolvedHook = `${idPrefix}${webhook.hook_name}`;

    const params: WebhookUnsubscribeParams = {
      webhook_method: webhook.webhook_method,
      webhook_type: webhook.webhook_type,
      batch_name: resolvedBatch,
      hook_name: resolvedHook,
    };

    if (!isFoundInList(existingWebhooks, params)) {
      logger.debug(
        `Webhook not found, skipping unsubscribe: ${getWebhookName(webhook)}`,
      );
      continue;
    }

    await deleteWebhookSubscription(commerceWebhooksClient, webhook, params);
    logger.info(`Unsubscribed webhook: ${getWebhookName(webhook)}`);
    unsubscribedWebhooks.push(params);
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
  if (isAlreadySubscribed(existingWebhooks, resolvedWebhook)) {
    logger.info(
      `Webhook already subscribed, skipping: ${getWebhookName(resolvedWebhook)}`,
    );
    return resolvedWebhook;
  }
  const subscribed = await createWebhookSubscription(client, resolvedWebhook);
  logger.info(`Subscribed webhook: ${getWebhookName(resolvedWebhook)}`);
  return subscribed;
}

/**
 * Subscribes a single webhook to Commerce, enriching the error with the webhook name
 * if the API responds with a string `message`.
 */
export async function createWebhookSubscription(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookSubscribeParams,
): Promise<WebhookSubscribeParams> {
  try {
    await client.subscribeWebhook(resolvedWebhook);
    return resolvedWebhook;
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
          `Webhook subscription failed for "${getWebhookName(resolvedWebhook)}": ${body.message}`,
        );
      }
    }
    throw err;
  }
}

/**
 * Unsubscribes a single webhook from Commerce, enriching the error with the webhook name
 * if the API responds with a string `message`.
 */
async function deleteWebhookSubscription(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookDefinition,
  params: WebhookUnsubscribeParams,
): Promise<void> {
  try {
    await client.unsubscribeWebhook(params);
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
          `Webhook unsubscription failed for "${getWebhookName(resolvedWebhook)}": ${body.message}`,
        );
      }
    }
    throw err;
  }
}

/** Shape of the developer_console_oauth credential block expected by the Commerce Webhooks API. */
type DeveloperConsoleOAuth = {
  client_id: string;
  client_secret: string;
  org_id: string;
  environment: string;
};

/**
 * Resolves and validates the IMS credentials required for `developer_console_oauth`.
 *
 * Delegates parsing and validation to `resolveImsAuthParams` from `aio-commerce-lib-auth`,
 * which correctly handles `AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS` whether it arrives as a
 * real array or as a JSON-stringified array string.
 */
export function resolveDeveloperConsoleOAuthCredentials(
  params: Record<string, unknown>,
): DeveloperConsoleOAuth {
  const { AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: imsEnvironment, ...imsParams } =
    params;

  const { clientId, clientSecrets, imsOrgId } = resolveImsAuthParams(imsParams);

  return {
    client_id: clientId,
    client_secret: clientSecrets[0],
    org_id: imsOrgId,
    environment:
      !imsEnvironment || String(imsEnvironment).startsWith("prod")
        ? ENVIRONMENT_PRODUCTION
        : ENVIRONMENT_STAGING,
  };
}

/**
 * Returns true when the candidate webhook is already present in the existing subscription list,
 * matched by the four-part identity: webhook_method, webhook_type, batch_name, hook_name.
 *
 * `webhook_method` is normalised before comparison to handle the case where Commerce strips the
 * `.magento` segment from plugin webhook methods on storage
 * (e.g. `plugin.magento.foo` and `plugin.foo` are treated as the same method).
 */
function isAlreadySubscribed(
  existing: CommerceWebhook[],
  candidate: WebhookSubscribeParams,
): boolean {
  const normalizedCandidate = normalizeWebhookMethod(candidate.webhook_method);
  return existing.some(
    (w) =>
      normalizeWebhookMethod(w.webhook_method) === normalizedCandidate &&
      w.webhook_type === candidate.webhook_type &&
      w.batch_name === candidate.batch_name &&
      w.hook_name === candidate.hook_name,
  );
}

/**
 * Returns true when a webhook with the given identity exists in the existing list.
 * Uses the same four-part identity and `webhook_method` normalisation as `isAlreadySubscribed`.
 */
function isFoundInList(
  existing: CommerceWebhook[],
  candidate: WebhookUnsubscribeParams,
): boolean {
  const normalizedCandidate = normalizeWebhookMethod(candidate.webhook_method);
  return existing.some(
    (w) =>
      normalizeWebhookMethod(w.webhook_method) === normalizedCandidate &&
      w.webhook_type === candidate.webhook_type &&
      w.batch_name === candidate.batch_name &&
      w.hook_name === candidate.hook_name,
  );
}

/**
 * Normalises a webhook method name by removing the `.magento` segment that Commerce
 * may drop when persisting plugin webhook methods.
 *
 * @example
 * normalizeWebhookMethod("plugin.magento.foo.bar") // → "plugin.foo.bar"
 * normalizeWebhookMethod("plugin.foo.bar")         // → "plugin.foo.bar" (unchanged)
 */
function normalizeWebhookMethod(method: string): string {
  return method.replace(PLUGIN_MAGENTO_REGEX, "plugin.");
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
 * are collapsed to one; a trailing underscore is appended. The result is lowercased
 * to ensure consistent matching regardless of input casing.
 *
 * @example
 * ```typescript
 * buildWebhookIdPrefix("my--app.v2") // => "my_app_v2_"
 * buildWebhookIdPrefix("MyApp") // => "myapp_"
 * ```
 * @param appId - The app ID to build the prefix from.
 * @return The built prefix string.
 */
export function buildWebhookIdPrefix(appId: string): string {
  const prefix = appId
    .toLowerCase()
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
function getWebhookName(
  webhook: WebhookDefinition | WebhookSubscribeParams,
): string {
  return `${webhook.webhook_method}:${webhook.webhook_type}`;
}
