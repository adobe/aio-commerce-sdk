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

import { buildCamelCaseKeysResponseHook } from "@adobe/aio-commerce-lib-api/utils";

import { parseOrThrow } from "#utils/valibot";

import {
  GetAllRegistrationsByConsumerOrgParamsSchema,
  GetAllRegistrationsParamsSchema,
  GetRegistrationByIdParamsSchema,
} from "./schema";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError, Options } from "@adobe/aio-commerce-lib-api/ky";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type {
  GetAllRegistrationsByConsumerOrgParams,
  GetAllRegistrationsParams,
  GetRegistrationByIdParams,
} from "./schema";
import type {
  IoEventRegistrationManyResponse,
  IoEventRegistrationOneResponse,
  IoEventRegistrationPaginatedResponse,
} from "./types";

/**
 * Gets all event registrations for a consumer organization (paginated).
 * @see https://developer.adobe.com/events/docs/api#operation/getAllRegistrationsForOrg
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the registrations with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getAllRegistrationsByConsumerOrg(
  httpClient: AdobeIoEventsHttpClient,
  params: GetAllRegistrationsByConsumerOrgParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    GetAllRegistrationsByConsumerOrgParamsSchema,
    params,
  );

  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get(`${validatedParams.consumerOrgId}/registrations`, fetchOptions)
    .json<IoEventRegistrationPaginatedResponse>();
}

/**
 * Gets all event registrations for a workspace.
 * @see https://developer.adobe.com/events/docs/api#operation/getAllRegistrations
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the registrations with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getAllRegistrations(
  httpClient: AdobeIoEventsHttpClient,
  params: GetAllRegistrationsParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(GetAllRegistrationsParamsSchema, params);
  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/registrations`,
      fetchOptions,
    )
    .json<IoEventRegistrationManyResponse>();
}

/**
 * Gets an event registration by ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getRegistration
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the registration with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function getRegistrationById(
  httpClient: AdobeIoEventsHttpClient,
  params: GetRegistrationByIdParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(GetRegistrationByIdParamsSchema, params);
  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [buildCamelCaseKeysResponseHook()],
    },
  });

  return withHooksClient
    .get(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/registrations/${validatedParams.registrationId}`,
      fetchOptions,
    )
    .json<IoEventRegistrationOneResponse>();
}
