import {
  AdobeCommerceHttpClient,
  ApiClient,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

import { updateEventingConfiguration } from "./eventing-configuration/endpoints";

import type {
  ApiFunction,
  CommerceHttpClientParams,
} from "@aio-commerce-sdk/aio-commerce-lib-api";

/**
 * Creates a new API client for the Commerce Events API client.
 * @param params - The parameters for the Commerce Events API.
 */
export function createCommerceEventsApiClient(
  params: CommerceHttpClientParams,
) {
  // By default we create a client that has all the endpoints available.
  // We should encourage creating custom clients (using the below factory function).
  return ApiClient.create(new AdobeCommerceHttpClient(params), {
    updateEventingConfiguration,
  });
}

/**
 * Creates a customized Commerce Events API client.
 * @param params - The parameters for the Commerce Events API.
 * @param functions - The API functions to include in the client.
 */
export function createCustomCommerceEventsApiClient<
  TFunctions extends Record<
    string,
    ApiFunction<AdobeCommerceHttpClient, unknown[], unknown>
  >,
>(params: CommerceHttpClientParams, functions: TFunctions) {
  return ApiClient.create(new AdobeCommerceHttpClient(params), functions);
}
