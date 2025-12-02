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

import { buildCamelCaseKeysResponseHook } from "@adobe/aio-commerce-lib-api/utils";
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { parseOrThrow } from "#utils/valibot";

import {
  EventProviderCreateParamsSchema,
  EventProviderGetByIdParamsSchema,
} from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError, Options } from "@adobe/aio-commerce-lib-api/ky";
import type {
  EventProviderCreateParams,
  EventProviderGetByIdParams,
} from "./schema";
import type {
  CommerceEventProviderManyResponse,
  CommerceEventProviderOneResponse,
} from "./types";

/**
 * Lists all event providers of the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-list-of-all-event-providers
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getAllEventProviders(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
) {
  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get("eventing/eventProvider", fetchOptions)
    .json<CommerceEventProviderManyResponse>();
}

/**
 * Gets the info of the event provider with the given ID of the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-event-provider-by-id
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to get the event provider by.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getEventProviderById(
  httpClient: AdobeCommerceHttpClient,
  params: EventProviderGetByIdParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventProviderGetByIdParamsSchema,
    params,
  );

  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get(`eventing/eventProvider/${validatedParams.providerId}`, fetchOptions)
    .json<CommerceEventProviderOneResponse>();
}

/**
 * Creates an event provider in the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#create-an-event-provider
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to create the event provider with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function createEventProvider(
  httpClient: AdobeCommerceHttpClient,
  params: EventProviderCreateParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(EventProviderCreateParamsSchema, params);
  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .post("eventing/eventProvider", {
      ...fetchOptions,
      json: {
        eventProvider: {
          provider_id: validatedParams.providerId,
          instance_id: validatedParams.instanceId,
          label: validatedParams.label,
          description: validatedParams.description,
          workspace_configuration:
            validatedParams.associatedWorkspaceConfiguration,
        },
      },
    })
    .json<CommerceEventProviderOneResponse>();
}
