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

import { buildCamelCaseKeysResponseHook } from "@aio-commerce-sdk/aio-commerce-lib-api/utils/transformations";

import { parseOrThrow } from "#utils/valibot";

import {
  CreateEventMetadataForProviderSchema,
  GetAllEventMetadataForProviderSchema,
  GetEventMetadataForEventAndProviderSchema,
} from "./schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { AdobeIoEventsHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";
import type {
  HTTPError,
  Options,
} from "@aio-commerce-sdk/aio-commerce-lib-api/ky";
import type {
  CreateEventMetadataForProviderParams,
  GetAllEventMetadataForProviderParams,
  GetEventMetadataForEventAndProviderParams,
} from "./schema";
import type {
  IoEventMetadataManyResponse,
  IoEventMetadataOneResponse,
} from "./types";

/**
 * Gets all event metadata for a specific provider.
 * @see https://developer.adobe.com/events/docs/api#operation/getByProviderId
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the event metadata with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getAllEventMetadataForProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: GetAllEventMetadataForProviderParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    GetAllEventMetadataForProviderSchema,
    params,
  );

  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get(`providers/${validatedParams.providerId}/eventmetadata`, fetchOptions)
    .json<IoEventMetadataManyResponse>();
}

/**
 * Gets event metadata for a specific event code and provider.
 * @see https://developer.adobe.com/events/docs/api#operation/getByProviderIdAndEventCode
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the event metadata with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getEventMetadataForEventAndProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: GetEventMetadataForEventAndProviderParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    GetEventMetadataForEventAndProviderSchema,
    params,
  );

  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get(
      `providers/${validatedParams.providerId}/eventmetadata/${validatedParams.eventCode}`,
      fetchOptions,
    )
    .json<IoEventMetadataOneResponse>();
}

/**
 * Creates event metadata for a provider.
 * @see https://developer.adobe.com/events/docs/api#operation/postEventMetadata
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the event metadata with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function createEventMetadataForProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: CreateEventMetadataForProviderParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    CreateEventMetadataForProviderSchema,
    params,
  );

  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .post(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/providers/${validatedParams.providerId}/eventmetadata`,
      {
        ...fetchOptions,
        json: {
          label: validatedParams.label,
          description: validatedParams.description,
          event_code: validatedParams.eventCode,
          sample_event_template: validatedParams.sampleEventTemplate,
        },
      },
    )
    .json<IoEventMetadataOneResponse>();
}
