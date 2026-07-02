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

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { Options } from "ky";

/**
 * Enables the Admin UI SDK in Commerce via PUT /V1/adminuisdk/config.
 *
 * This must be called before {@link registerExtension} so that Commerce accepts
 * the extension registration; registering an extension while the SDK is disabled
 * leaves the extension unavailable in the Admin UI.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param fetchOptions - Optional Ky fetch options.
 *
 * @throws An `HTTPError` if the status code is not 2XX.
 */
export async function enableAdminUiSdk(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
): Promise<boolean> {
  return httpClient
    .put("adminuisdk/config", {
      ...fetchOptions,
      json: { enableAdminUiSdk: true },
    })
    .json<boolean>();
}
