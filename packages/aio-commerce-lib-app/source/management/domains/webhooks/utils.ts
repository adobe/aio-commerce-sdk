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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";

import { appliesToEnv } from "#config/lib/environment";

import type {
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { getInstallCommerceEnv } from "#config/lib/environment";
import type { WebhookEntry } from "#config/schema/webhooks";
import type { WebhooksExecutionContext } from "./context";
import type { ResolvedWebhookPayload, WebhookIdentity } from "./types";

/** Matches any character that is not a valid identifier character (letter, digit, or underscore). */
const NON_IDENTIFIER_CHAR_REGEX = /[^a-zA-Z0-9_]/g;

/** Matches two or more consecutive underscores. */
const MULTIPLE_UNDERSCORES_REGEX = /_+/g;

/** Matches the `.magento` segment in plugin webhook method names (e.g. `plugin.magento.foo`). */
const PLUGIN_MAGENTO_REGEX = /^plugin\.magento\./;

const ENVIRONMENT_PRODUCTION = "production";
const ENVIRONMENT_STAGING = "staging";

/** Narrows any webhook-like value down to its identity fields. */
export function toIdentity<T extends WebhookIdentity>(
  webhook: T,
): WebhookIdentity {
  return {
    batch_name: webhook.batch_name,
    hook_name: webhook.hook_name,
    webhook_method: webhook.webhook_method,
    webhook_type: webhook.webhook_type,
  };
}

/** Builds a stable, human-traceable id for a planned add/remove operation. */
export function webhookOperationId(
  kind: "add" | "remove",
  identity: WebhookIdentity,
): string {
  return `${kind}:${identity.webhook_method}:${identity.webhook_type}:${identity.batch_name}:${identity.hook_name}`;
}

/** Formats a webhook as "webhook_method:webhook_type" for logging/labels. */
export function getWebhookName(
  webhook: Pick<WebhookIdentity, "webhook_method" | "webhook_type">,
): string {
  return `${webhook.webhook_method}:${webhook.webhook_type}`;
}

/**
 * True when two webhook identities refer to the same Commerce webhook. `webhook_method` is
 * normalised first, since Commerce strips the `.magento` segment from plugin methods on storage.
 */
export function webhookIdentitiesMatch(
  a: WebhookIdentity,
  b: WebhookIdentity,
): boolean {
  return (
    normalizeWebhookMethod(a.webhook_method) ===
      normalizeWebhookMethod(b.webhook_method) &&
    a.webhook_type === b.webhook_type &&
    a.batch_name === b.batch_name &&
    a.hook_name === b.hook_name
  );
}

/** True when a webhook with the given four-part identity exists in the list. */
export function isWebhookInList(
  existing: readonly WebhookIdentity[],
  candidate: WebhookIdentity,
): boolean {
  return existing.some((w) => webhookIdentitiesMatch(w, candidate));
}

/** Returns whether a webhook identity is present in the desired target set. */
export function isDesiredWebhook(
  webhook: WebhookIdentity,
  desiredWebhooks: readonly WebhookIdentity[],
): boolean {
  return isWebhookInList(desiredWebhooks, webhook);
}

/** Strips the `.magento` segment Commerce drops when persisting plugin webhook methods. */
function normalizeWebhookMethod(method: string): string {
  return method.replace(PLUGIN_MAGENTO_REGEX, "plugin.");
}

/** Builds a runtime action's invocation URL from the current namespace. */
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
 * Builds a namespacing prefix from the app ID for webhook batch/hook names.
 * @example buildWebhookIdPrefix("My--App.V2") // => "my_app_v2_"
 */
export function buildWebhookIdPrefix(appId: string): string {
  const prefix = appId
    .toLowerCase()
    .replace(NON_IDENTIFIER_CHAR_REGEX, "_")
    .replace(MULTIPLE_UNDERSCORES_REGEX, "_");
  return prefix.endsWith("_") ? prefix : `${prefix}_`;
}

/** Returns whether a Commerce webhook belongs to the app with the given metadata ID. */
export function isWebhookOwnedByApp(
  webhook: Pick<WebhookIdentity, "batch_name" | "hook_name">,
  appId: string,
): boolean {
  const idPrefix = buildWebhookIdPrefix(appId);
  return (
    webhook.batch_name.startsWith(idPrefix) &&
    webhook.hook_name.startsWith(idPrefix)
  );
}

/** Resolves every configured webhook that applies to the Commerce environment. */
export function resolveDesiredWebhooks(
  config: { metadata: { id: string }; webhooks: WebhookEntry[] },
  env: ReturnType<typeof getInstallCommerceEnv>,
): ResolvedWebhookPayload[] {
  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  return config.webhooks
    .filter((entry) => appliesToEnv(entry, env))
    .map((entry) => resolveWebhookPayload(entry, idPrefix));
}

/** Resolves a config webhook entry's identity/payload (idPrefix, URL) — no credentials. Pure. */
export function resolveWebhookPayload(
  entry: WebhookEntry,
  idPrefix: string,
): ResolvedWebhookPayload {
  const { webhook } = entry;
  const resolvedUrl =
    "runtimeAction" in entry
      ? generateUrlForRuntimeAction(entry.runtimeAction)
      : entry.webhook.url;

  return {
    ...webhook,
    batch_name: `${idPrefix}${webhook.batch_name}`,
    hook_name: `${idPrefix}${webhook.hook_name}`,
    requiresAdobeAuth:
      "runtimeAction" in entry && entry.requireAdobeAuth !== false,
    url: resolvedUrl,
  };
}

/** Resolves a config webhook entry into wire-format subscribe params, attaching OAuth credentials when required. */
export function resolveWebhookSubscribeParams(
  entry: WebhookEntry,
  idPrefix: string,
  params: WebhooksExecutionContext["params"],
): WebhookSubscribeParams {
  const { requiresAdobeAuth, ...resolved } = resolveWebhookPayload(
    entry,
    idPrefix,
  );

  return {
    ...resolved,
    ...(requiresAdobeAuth && {
      developer_console_oauth: resolveDeveloperConsoleOAuthCredentials(params),
    }),
  };
}

/** Shape of the developer_console_oauth credential block expected by the Commerce Webhooks API. */
type DeveloperConsoleOAuth = {
  client_id: string;
  client_secret: string;
  org_id: string;
  environment: string;
};

/** Resolves and validates the IMS credentials required for `developer_console_oauth`. */
export function resolveDeveloperConsoleOAuthCredentials(
  params: Record<string, unknown>,
): DeveloperConsoleOAuth {
  const { AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: imsEnvironment, ...imsParams } =
    params;

  const { clientId, clientSecrets, imsOrgId } = resolveImsAuthParams(imsParams);

  return {
    client_id: clientId,
    client_secret: clientSecrets[0],
    environment:
      !imsEnvironment || String(imsEnvironment).startsWith("prod")
        ? ENVIRONMENT_PRODUCTION
        : ENVIRONMENT_STAGING,
    org_id: imsOrgId,
  };
}

/** Re-throws `err` with an enriched message: the webhook name and the unwrapped HTTP body, if any. */
async function rethrowWithWebhookName(
  err: unknown,
  webhookName: string,
  operation: string,
): Promise<never> {
  const msg = await unwrapHttpError(err);
  throw new Error(
    `Failed to ${operation} webhook subscription for "${webhookName}": ${msg}`,
  );
}

/** Subscribes a single webhook, enriching the error with the webhook name if the API responds with a string `message`. */
export async function createWebhookSubscription(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookSubscribeParams,
): Promise<WebhookSubscribeParams> {
  try {
    await client.subscribeWebhook(resolvedWebhook);
    return resolvedWebhook;
  } catch (err) {
    return await rethrowWithWebhookName(
      err,
      getWebhookName(resolvedWebhook),
      "create",
    );
  }
}

/** Unsubscribes a single webhook, enriching the error with the webhook name if the API responds with a string `message`. */
export async function deleteWebhookSubscription(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookIdentity,
  params: WebhookUnsubscribeParams,
): Promise<void> {
  try {
    await client.unsubscribeWebhook(params);
  } catch (err) {
    return rethrowWithWebhookName(
      err,
      getWebhookName(resolvedWebhook),
      "delete",
    );
  }
}
