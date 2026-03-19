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

import * as v from "valibot";

import {
  WebhookSubscribeParamsSchema,
  WebhookUnsubscribeParamsSchema,
} from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { HTTPError, Options } from "ky";
import type {
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "./schema";
import type {
  CommerceSupportedWebhookManyResponse,
  CommerceWebhookManyResponse,
} from "./types";

/**
 * Returns a list of all subscribed webhooks in the Commerce instance.
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/api/#get-a-list-of-all-subscribed-webhooks
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param fetchOptions - The {@link Options} to use to make the request.
 */
export function getWebhookList(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
) {
  return httpClient
    .get("webhooks/list", fetchOptions)
    .json<CommerceWebhookManyResponse>();
}

/**
 * Subscribes a webhook in the Commerce instance.
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/api/#subscribe-a-webhook
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The webhook payload (webhook_method, webhook_type, batch_name, hook_name, url, etc.).
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function subscribeWebhook(
  httpClient: AdobeCommerceHttpClient,
  params: WebhookSubscribeParams,
  fetchOptions?: Options,
) {
  const validatedParams = v.parse(WebhookSubscribeParamsSchema, params);

  return httpClient
    .post("webhooks/subscribe", {
      ...fetchOptions,
      json: { webhook: validatedParams },
    })
    .json<void>();
}

/**
 * Unsubscribes a webhook from the Commerce instance.
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/api/#unsubscribe-a-webhook
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The webhook identifiers (webhook_method, webhook_type, batch_name, hook_name).
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function unsubscribeWebhook(
  httpClient: AdobeCommerceHttpClient,
  params: WebhookUnsubscribeParams,
  fetchOptions?: Options,
) {
  const validatedParams = v.parse(WebhookUnsubscribeParamsSchema, params);

  return httpClient
    .post("webhooks/unsubscribe", {
      ...fetchOptions,
      json: { webhook: validatedParams },
    })
    .json<void>();
}

/**
 * Returns the list of webhooks supported in Adobe Commerce as a Cloud Service (SaaS only).
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/api/#get-supported-webhooks-for-saas
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param fetchOptions - The {@link Options} to use to make the request.
 */
export function getSupportedWebhookList(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
) {
  return httpClient
    .get("webhooks/supportedList", fetchOptions)
    .json<CommerceSupportedWebhookManyResponse>();
}
