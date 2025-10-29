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

import { createEventProvider, getAllEventProviders } from "./endpoints";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError, Options } from "@adobe/aio-commerce-lib-api/ky";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { OmitDeep } from "type-fest";
import type {
  EventProviderCreateParams,
  EventProviderListAllParams,
} from "./schema";

/**
 * Lists all Commerce (of type `dx_commerce_events`) event providers for the given consumer organization ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to list the event providers with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getAllCommerceEventProviders(
  httpClient: AdobeIoEventsHttpClient,
  params: OmitDeep<EventProviderListAllParams, "filterBy.providerType">,
  fetchOptions?: Options,
) {
  return getAllEventProviders(
    httpClient,
    {
      ...params,
      filterBy: {
        ...params.filterBy,
        providerTypes: ["dx_commerce_events"],
      },
    },
    fetchOptions,
  );
}

/**
 * Lists all 3rd Party Custom Events (of type `3rd_party_custom_events`) event providers for the given consumer organization ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to list the event providers with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getAll3rdPartyCustomEventProviders(
  httpClient: AdobeIoEventsHttpClient,
  params: OmitDeep<EventProviderListAllParams, "filterBy.providerType">,
  fetchOptions?: Options,
) {
  return getAllEventProviders(
    httpClient,
    {
      ...params,
      filterBy: {
        ...params.filterBy,
        providerTypes: ["3rd_party_custom_events"],
      },
    },
    fetchOptions,
  );
}

/**
 * Creates a Commerce (of type `dx_commerce_events`) event provider.
 * @see https://developer.adobe.com/events/docs/api#operation/createProvider
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the event provider with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function createCommerceEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: OmitDeep<EventProviderCreateParams, "providerType">,
  fetchOptions?: Options,
) {
  return createEventProvider(
    httpClient,
    { ...params, providerType: "dx_commerce_events" },
    fetchOptions,
  );
}
/**
 * Creates a 3rd Party Custom Events (of type `3rd_party_custom_events`) event provider.
 * @see https://developer.adobe.com/events/docs/api#operation/createProvider
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the event provider with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function create3rdPartyCustomEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: OmitDeep<EventProviderCreateParams, "providerType">,
  fetchOptions?: Options,
) {
  return createEventProvider(
    httpClient,
    { ...params, providerType: "3rd_party_custom_events" },
    fetchOptions,
  );
}
