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
  AdobeCommerceHttpClient,
  ApiClient,
} from "@adobe/aio-commerce-lib-api";

import * as eventProviderEndpoints from "#commerce/api/event-providers/endpoints";
import * as eventSubscriptionsEndpoints from "#commerce/api/event-subscriptions/endpoints";
import { updateEventingConfiguration } from "#commerce/api/eventing-configuration/endpoints";

import type {
  ApiFunction,
  CommerceHttpClientParams,
} from "@adobe/aio-commerce-lib-api";

/**
 * Creates a new API client for the Commerce Events API client.
 * @param params - The parameters to build the Commerce HTTP client that will communicate with the Commerce Events API.
 */
export function createCommerceEventsApiClient(
  params: CommerceHttpClientParams,
) {
  // By default we create a client that has all the endpoints available.
  // We should encourage creating custom clients (using the below factory function).
  return ApiClient.create(new AdobeCommerceHttpClient(params), {
    ...eventProviderEndpoints,
    ...eventSubscriptionsEndpoints,
    updateEventingConfiguration,
  });
}

/**
 * An API Client for the Commerce Events API.
 * @see {@link createCommerceEventsApiClient}
 */
export type CommerceEventsApiClient = ReturnType<
  typeof createCommerceEventsApiClient
>;

/**
 * Creates a customized Commerce Events API client.
 * @param params - The parameters to build the Commerce HTTP client that will communicate with the Commerce Events API.
 * @param functions - The API functions to include in the client.
 */
export function createCustomCommerceEventsApiClient<
  TFunctions extends Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
    ApiFunction<AdobeCommerceHttpClient, any[], any>
  >,
>(params: CommerceHttpClientParams, functions: TFunctions) {
  return ApiClient.create(new AdobeCommerceHttpClient(params), functions);
}
