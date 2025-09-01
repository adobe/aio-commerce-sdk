import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

import { parseOrThrow } from "~/utils/valibot";

import {
  EventProviderCreateParamsSchema,
  EventProviderGetByIdParamsSchema,
} from "./schema";

import type { AdobeCommerceHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";
import type { HTTPError, Options } from "ky";
import type {
  EventProviderCreateParams,
  EventProviderGetByIdParams,
} from "./schema";

/**
 * Lists all event providers of the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-list-of-all-event-providers
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to list the event providers with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function getAllEventProviders(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
) {
  const endpoint = "eventing/eventProvider";
  return httpClient.get(endpoint, fetchOptions);
}

/**
 * Gets the info of the event provider with the given ID of the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-event-provider-by-id
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to get the event provider by.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function getEventProviderById(
  httpClient: AdobeCommerceHttpClient,
  params: EventProviderGetByIdParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventProviderGetByIdParamsSchema,
    params,
  );

  const endpoint = `eventing/eventProvider/${validatedParams.providerId}`;
  return httpClient.get(endpoint, fetchOptions);
}

/**
 * Creates an event provider in the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#create-an-event-provider
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to create the event provider with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function createEventProvider(
  httpClient: AdobeCommerceHttpClient,
  params: EventProviderCreateParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(EventProviderCreateParamsSchema, params);

  const endpoint = "eventing/eventProvider";
  return httpClient.post(endpoint, {
    ...fetchOptions,
    json: {
      eventProvider: {
        provider_id: validatedParams.providerId,
        instance_id: validatedParams.instanceId,
        label: validatedParams.label,
        description: validatedParams.description,
        associated_workspace_configuration:
          validatedParams.associatedWorkspaceConfiguration,
      },
    },
  });
}
