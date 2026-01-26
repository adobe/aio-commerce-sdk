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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { setArrayQueryParam, setQueryParamIfTruthy } from "#utils/query-params";

import {
  EventProviderCreateParamsSchema,
  EventProviderGetByIdParamsSchema,
  EventProviderListAllParamsSchema,
} from "./schema";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError, Options } from "@adobe/aio-commerce-lib-api/ky";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type {
  EventProviderCreateParams,
  EventProviderGetByIdParams,
  EventProviderListAllParams,
} from "./schema";
import type {
  IoEventProviderManyResponse,
  IoEventProviderOneResponse,
} from "./types";

/**
 * Lists all event providers for the given consumer organization ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to list the event providers with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 */
export async function getAllEventProviders(
  httpClient: AdobeIoEventsHttpClient,
  params: EventProviderListAllParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventProviderListAllParamsSchema,
    params,
  );

  const queryParams = new URLSearchParams();
  const { providerTypes = [], instanceId } = validatedParams.filterBy ?? {};

  setArrayQueryParam(queryParams, "providerMetadataIds", providerTypes);
  setQueryParamIfTruthy(queryParams, "instanceId", instanceId);
  setQueryParamIfTruthy(
    queryParams,
    "eventmetadata",
    validatedParams.withEventMetadata,
  );

  return httpClient
    .get(`${validatedParams.consumerOrgId}/providers`, {
      ...fetchOptions,
      searchParams: queryParams,
    })
    .json<IoEventProviderManyResponse>();
}

/**
 * Gets an event provider by ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersById
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the event provider by.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getEventProviderById(
  httpClient: AdobeIoEventsHttpClient,
  params: EventProviderGetByIdParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventProviderGetByIdParamsSchema,
    params,
  );

  const searchParams = new URLSearchParams();
  setQueryParamIfTruthy(
    searchParams,
    "eventmetadata",
    validatedParams.withEventMetadata,
  );

  return httpClient
    .get(`providers/${params.providerId}`, {
      ...fetchOptions,
      searchParams,
    })
    .json<IoEventProviderOneResponse>();
}

/**
 * Creates an event provider.
 * @see https://developer.adobe.com/events/docs/api#operation/createProvider
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the event provider with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function createEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: EventProviderCreateParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(EventProviderCreateParamsSchema, params);

  return httpClient
    .post(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/providers`,
      {
        ...fetchOptions,
        json: {
          ...validatedParams,

          docs_url: validatedParams.docsUrl,
          provider_metadata: validatedParams.providerType,
          instance_id: validatedParams.instanceId,
          data_residency_region: validatedParams.dataResidencyRegion,
        },
      },
    )
    .json<IoEventProviderOneResponse>();
}
