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

import {
  CreateRegistrationParamsSchema,
  DeleteRegistrationParamsSchema,
  GetAllRegistrationsByConsumerOrgParamsSchema,
  GetAllRegistrationsParamsSchema,
  GetRegistrationByIdParamsSchema,
  UpdateRegistrationParamsSchema,
} from "./schema";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { HTTPError, Options } from "ky";
import type {
  CreateRegistrationParams,
  DeleteRegistrationParams,
  GetAllRegistrationsByConsumerOrgParams,
  GetAllRegistrationsParams,
  GetRegistrationByIdParams,
  UpdateRegistrationParams,
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

  return httpClient
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

  return httpClient
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

  return httpClient
    .get(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/registrations/${validatedParams.registrationId}`,
      fetchOptions,
    )
    .json<IoEventRegistrationOneResponse>();
}

/**
 * Creates an event registration.
 * @see https://developer.adobe.com/events/docs/api#operation/createRegistration
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the registration with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function createRegistration(
  httpClient: AdobeIoEventsHttpClient,
  params: CreateRegistrationParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(CreateRegistrationParamsSchema, params);

  return httpClient
    .post(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/registrations`,
      {
        ...fetchOptions,
        json: {
          client_id: validatedParams.clientId,
          delivery_type: validatedParams.deliveryType,
          description: validatedParams.description,
          destination_metadata: validatedParams.destinationMetadata
            ? {
                aws_account_id:
                  validatedParams.destinationMetadata.awsAccountId,
                aws_region: validatedParams.destinationMetadata.awsRegion,
              }
            : undefined,
          enabled: validatedParams.enabled,
          events_of_interest: validatedParams.eventsOfInterest.map((event) => ({
            event_code: event.eventCode,
            provider_id: event.providerId,
          })),
          name: validatedParams.name,
          runtime_action: validatedParams.runtimeAction,
          subscriber_filters: validatedParams.subscriberFilters?.map(
            (filter) => ({
              description: filter.description,
              name: filter.name,
              subscriber_filter: filter.subscriberFilter,
            }),
          ),
          webhook_url: validatedParams.webhookUrl,
        },
      },
    )
    .json<IoEventRegistrationOneResponse>();
}

/**
 * Updates an event registration.
 * @see https://developer.adobe.com/events/docs/api#operation/updateRegistration
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to update the registration with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function updateRegistration(
  httpClient: AdobeIoEventsHttpClient,
  params: UpdateRegistrationParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(UpdateRegistrationParamsSchema, params);

  return httpClient
    .put(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/registrations/${validatedParams.registrationId}`,
      {
        ...fetchOptions,
        json: {
          delivery_type: validatedParams.deliveryType,
          description: validatedParams.description,
          destination_metadata: validatedParams.destinationMetadata
            ? {
                aws_account_id:
                  validatedParams.destinationMetadata.awsAccountId,
                aws_region: validatedParams.destinationMetadata.awsRegion,
              }
            : undefined,
          enabled: validatedParams.enabled,
          events_of_interest: validatedParams.eventsOfInterest.map((event) => ({
            event_code: event.eventCode,
            provider_id: event.providerId,
          })),
          name: validatedParams.name,
          runtime_action: validatedParams.runtimeAction,
          subscriber_filters: validatedParams.subscriberFilters?.map(
            (filter) => ({
              description: filter.description,
              name: filter.name,
              subscriber_filter: filter.subscriberFilter,
            }),
          ),
          webhook_url: validatedParams.webhookUrl,
        },
      },
    )
    .json<IoEventRegistrationOneResponse>();
}

/**
 * Deletes an event registration.
 * @see https://developer.adobe.com/events/docs/api#operation/deleteRegistration
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to delete the registration with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function deleteRegistration(
  httpClient: AdobeIoEventsHttpClient,
  params: DeleteRegistrationParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(DeleteRegistrationParamsSchema, params);
  return httpClient
    .delete(
      `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/registrations/${validatedParams.registrationId}`,
      fetchOptions,
    )
    .then((_res) => {
      // We set this `then` to make the response type `void`
    });
}
