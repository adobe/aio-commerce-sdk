/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { buildCamelCaseKeysResponseHook } from "@adobe/aio-commerce-lib-api/utils/transformations";

import { parseOrThrow } from "#utils/valibot";

import { EventSubscriptionCreateParamsSchema } from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError, Options } from "@adobe/aio-commerce-lib-api/ky";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { EventSubscriptionCreateParams } from "./schema";
import type { CommerceEventSubscriptionManyResponse } from "./types";

/**
 * Gets all event subscriptions in the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-a-list-of-all-subscribed-events
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param fetchOptions - The {@link Options} to use to make the request.
 */
export async function getAllEventSubscriptions(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
) {
  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get("eventing/getEventSubscriptions", fetchOptions)
    .json<CommerceEventSubscriptionManyResponse>();
}

/**
 * Creates an event subscription in the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#subscribe-to-events
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to create the event subscription with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function createEventSubscription(
  httpClient: AdobeCommerceHttpClient,
  params: EventSubscriptionCreateParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventSubscriptionCreateParamsSchema,
    params,
  );

  const { force, ...event } = validatedParams;
  return httpClient
    .post("eventing/eventSubscribe", {
      ...fetchOptions,
      json: {
        force,
        event: {
          name: event.name,
          parent: event.parent,
          fields: event.fields,
          destination: event.destination,
          hipaa_audit_required: event.hipaaAuditRequired,
          priority: event.prioritary,
          provider_id: event.providerId,
        },
      },
    })
    .json()
    .then((_res) => {
      // The response is always `[]` which is basically `void`
      // We set this `then` to make the response type `void`
    });
}
