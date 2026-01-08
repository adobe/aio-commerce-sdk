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

import {
  AdobeIoEventsHttpClient,
  ApiClient,
} from "@adobe/aio-commerce-lib-api";

import * as eventMetadataEndpoints from "#io-events/api/event-metadata/endpoints";
import * as eventProviderEndpoints from "#io-events/api/event-providers/endpoints";
import * as eventProviderShorthands from "#io-events/api/event-providers/shorthands";
import * as eventRegistrationEndpoints from "#io-events/api/event-registrations/endpoints";

import type {
  ApiFunction,
  IoEventsHttpClientParams,
} from "@adobe/aio-commerce-lib-api";

/**
 * Creates a new API client for the Adobe I/O Events API client.
 * @param params - The parameters to build the Adobe I/O Events HTTP client that will communicate with the Adobe I/O Events API.
 */
export function createAdobeIoEventsApiClient(params: IoEventsHttpClientParams) {
  // By default we create a client that has all the endpoints available.
  // We should encourage creating custom clients (using the below factory function).
  return ApiClient.create(new AdobeIoEventsHttpClient(params), {
    ...eventProviderEndpoints,
    ...eventMetadataEndpoints,
    ...eventProviderShorthands,
    ...eventRegistrationEndpoints,
  });
}

/**
 * Creates a customized Adobe I/O Events API client.
 * @param params - The parameters to build the Adobe I/O Events HTTP client that will communicate with the Adobe I/O Events API.
 * @param functions - The API functions to include in the client.
 */
export function createCustomAdobeIoEventsApiClient<
  TFunctions extends Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
    ApiFunction<AdobeIoEventsHttpClient, any[], any>
  >,
>(params: IoEventsHttpClientParams, functions: TFunctions) {
  return ApiClient.create(new AdobeIoEventsHttpClient(params), functions);
}
