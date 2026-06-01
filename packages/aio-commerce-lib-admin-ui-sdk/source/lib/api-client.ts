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

import {
  AdobeCommerceHttpClient,
  ApiClient,
} from "@adobe/aio-commerce-lib-api";

import * as extensionEndpoints from "#api/extensions/endpoints";
import * as permissionEndpoints from "#api/permissions/endpoints";

import type {
  ApiFunction,
  CommerceHttpClientParams,
} from "@adobe/aio-commerce-lib-api";

/**
 * Creates a new API client for the Admin UI SDK API with all available operations.
 *
 * @param params - The parameters to build the Commerce HTTP client.
 */
export function createAdminUiSdkApiClient(params: CommerceHttpClientParams) {
  return ApiClient.create(new AdobeCommerceHttpClient(params), {
    ...extensionEndpoints,
    ...permissionEndpoints,
  });
}

/**
 * An API client for the Admin UI SDK API with all operations.
 * @see {@link createAdminUiSdkApiClient}
 */
export type AdminUiSdkApiClient = ReturnType<typeof createAdminUiSdkApiClient>;

/**
 * Creates a customized Admin UI SDK API client with a user-specified set of endpoint functions.
 * @param params - The parameters to build the Commerce HTTP client.
 * @param functions - The API functions to include in the client.
 */
export function createCustomAdminUiSdkApiClient<
  TFunctions extends Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
    ApiFunction<AdobeCommerceHttpClient, any[], any>
  >,
>(params: CommerceHttpClientParams, functions: TFunctions) {
  return ApiClient.create(new AdobeCommerceHttpClient(params), functions);
}
