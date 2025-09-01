import {
  AdobeIoEventsHttpClient,
  ApiClient,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

import * as eventProviderEndpoints from "~/io-events/api/event-providers/endpoints";
import * as eventProviderShorthands from "~/io-events/api/event-providers/shorthands";

import type {
  ApiFunction,
  IoEventsHttpClientParams,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

/**
 * Creates a new API client for the Adobe I/O Events API client.
 * @param params - The parameters for the Commerce Events API.
 */
export function createAdobeIoEventsApiClient(params: IoEventsHttpClientParams) {
  // By default we create a client that has all the endpoints available.
  // We should encourage creating custom clients (using the below factory function).
  return ApiClient.create(new AdobeIoEventsHttpClient(params), {
    ...eventProviderEndpoints,
    ...eventProviderShorthands,
  });
}

/**
 * Creates a customized Adobe I/O Events API client.
 * @param params - The parameters for the Adobe I/O Events API.
 * @param functions - The API functions to include in the client.
 */
export function createCustomAdobeIoEventsApiClient<
  TFunctions extends Record<
    string,
    ApiFunction<AdobeIoEventsHttpClient, unknown[], unknown>
  >,
>(params: IoEventsHttpClientParams, functions: TFunctions) {
  return ApiClient.create(new AdobeIoEventsHttpClient(params), functions);
}
