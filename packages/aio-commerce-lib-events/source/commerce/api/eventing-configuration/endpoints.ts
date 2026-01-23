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

import { UpdateEventingConfigurationParamsSchema } from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError, Options } from "@adobe/aio-commerce-lib-api/ky";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { UpdateEventingConfigurationParams } from "./schema";

/**
 * Updates the configuration of the Commerce Eventing API.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#configure-commerce-eventing
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to update the configuration with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function updateEventingConfiguration(
  httpClient: AdobeCommerceHttpClient,
  params: UpdateEventingConfigurationParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    UpdateEventingConfigurationParamsSchema,
    params,
  );

  return httpClient
    .put("eventing/updateConfiguration", {
      ...fetchOptions,
      json: {
        config: validatedParams,
      },
    })
    .json<boolean>();
}
