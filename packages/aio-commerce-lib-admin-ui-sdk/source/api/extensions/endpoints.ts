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
  UninstallExtensionParamsSchema,
} from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { Options } from "ky";
import type {
  ExtensionRegistrationParams,
  UninstallExtensionParams,
} from "./schema";
import type { ExtensionRegistrationResult } from "./types";

/**
 * Registers an Admin UI SDK extension with Commerce via POST /V1/adminuisdk/extension.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The extension registration parameters.
 * @param fetchOptions - Optional Ky fetch options.
 *
 * @throws An `HTTPError` if the status code is not 2XX.
 */
export async function registerExtension(
  httpClient: AdobeCommerceHttpClient,
  params: ExtensionRegistrationParams,
  fetchOptions?: Options,
): Promise<ExtensionRegistrationResult> {
  const extension = parseOrThrow(ExtensionRegistrationParamsSchema, params);

  return httpClient
    .post("adminuisdk/extension", {
      ...fetchOptions,
      json: { extension },
    })
    .json<ExtensionRegistrationResult>();
}

/**
 * Unregisters an Admin UI SDK extension from Commerce via DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The workspace and extension names.
 * @param fetchOptions - Optional Ky fetch options.
 *
 * @throws An `HTTPError` if the status code is not 2XX.
 */
export async function uninstallExtension(
  httpClient: AdobeCommerceHttpClient,
  params: UninstallExtensionParams,
  fetchOptions?: Options,
): Promise<void> {
  const { workspaceName, extensionName } = parseOrThrow(
    UninstallExtensionParamsSchema,
    params,
  );

  await httpClient.delete(
    `adminuisdk/extension/${workspaceName}/${extensionName}`,
    fetchOptions,
  );
}
