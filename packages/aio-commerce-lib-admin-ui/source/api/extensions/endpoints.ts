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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import {
  ExtensionRegistrationParamsSchema,
  RefreshExtensionParamsSchema,
  UnregisterExtensionParamsSchema,
} from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { Options } from "ky";
import type {
  ExtensionRegistrationParams,
  RefreshExtensionParams,
  RegisterExtensionResponse,
  UnregisterExtensionParams,
} from "./schema";

/**
 * Registers an Admin UI extension with Commerce via POST /V1/adminuisdk/extension.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The extension registration parameters.
 * @param fetchOptions - Optional Ky fetch options.
 *
 * @throws A `CommerceSdkValidationError` if the parameters are invalid.
 * @throws An `HTTPError` if the status code is not 2XX.
 */
export async function registerExtension(
  httpClient: AdobeCommerceHttpClient,
  params: ExtensionRegistrationParams,
  fetchOptions?: Options,
): Promise<RegisterExtensionResponse> {
  const extension = parseOrThrow(ExtensionRegistrationParamsSchema, params);

  return httpClient
    .post("adminuisdk/extension", {
      ...fetchOptions,
      json: { extension },
    })
    .json<RegisterExtensionResponse>();
}

/**
 * Unregisters an Admin UI extension from Commerce via DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The workspace and extension names.
 * @param fetchOptions - Optional Ky fetch options.
 *
 * @throws A `CommerceSdkValidationError` if the parameters are invalid.
 * @throws An `HTTPError` if the status code is not 2XX.
 */
export async function unregisterExtension(
  httpClient: AdobeCommerceHttpClient,
  params: UnregisterExtensionParams,
  fetchOptions?: Options,
): Promise<void> {
  const { workspaceName, extensionName } = parseOrThrow(
    UnregisterExtensionParamsSchema,
    params,
  );

  return httpClient
    .delete(
      `adminuisdk/extension/${workspaceName}/${extensionName}`,
      fetchOptions,
    )
    .then((_res) => {
      // We set this `then` to make the response type `void`
    });
}

/**
 * Refreshes an existing Admin UI extension's registrations from the App Registry via
 * POST /V1/adminuisdk/extension/{workspaceName}/{extensionName}/refresh. Unlike
 * {@link registerExtension}, this does not modify the extension record itself — it only
 * re-syncs its registrations.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The workspace and extension names.
 * @param fetchOptions - Optional Ky fetch options.
 *
 * @throws A `CommerceSdkValidationError` if the parameters are invalid.
 * @throws An `HTTPError` if the status code is not 2XX (e.g. a 404 if the extension is
 * not registered, or if this Commerce instance's Admin UI SDK module does not expose this route).
 */
export async function refreshExtension(
  httpClient: AdobeCommerceHttpClient,
  params: RefreshExtensionParams,
  fetchOptions?: Options,
): Promise<void> {
  const { workspaceName, extensionName } = parseOrThrow(
    RefreshExtensionParamsSchema,
    params,
  );

  return httpClient
    .post(
      `adminuisdk/extension/${workspaceName}/${extensionName}/refresh`,
      fetchOptions,
    )
    .then((_res) => {
      // We set this `then` to make the response type `void`
    });
}
