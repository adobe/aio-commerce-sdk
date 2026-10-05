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

import { getWebhookName } from "./utils";

import type {
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksExecutionContext } from "./context";
import type { WebhookIdentity } from "./types";

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
