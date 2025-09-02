import {
  setArrayQueryParam,
  setQueryParamIfTruthy,
} from "~/utils/query-params";
import { parseOrThrow } from "~/utils/valibot";

import {
  EventProviderCreateParamsSchema,
  EventProviderGetByIdParamsSchema,
  EventProviderListAllParamsSchema,
} from "./schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { AdobeIoEventsHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";
import type { HTTPError, Options } from "ky";
import type {
  EventProviderCreateParams,
  EventProviderGetByIdParams,
  EventProviderListAllParams,
} from "./schema";

/**
 * Lists all event providers for the given consumer organization ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to list the event providers with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 */
export function getAllEventProviders(
  httpClient: AdobeIoEventsHttpClient,
  params: EventProviderListAllParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(EventProviderListAllParamsSchema, {
    params,
  });

  const queryParams = new URLSearchParams();
  const { providerTypes = [], instanceId } = validatedParams.filterBy ?? {};

  setArrayQueryParam(queryParams, "providerMetadataIds", providerTypes);
  setQueryParamIfTruthy(queryParams, "instanceId", instanceId);
  setQueryParamIfTruthy(
    queryParams,
    "eventmetadata",
    validatedParams.withEventMetadata,
  );

  return httpClient.get(`${validatedParams.consumerOrgId}/providers`, {
    ...fetchOptions,
    searchParams: queryParams,
  });
}

/**
 * Gets an event provider by ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersById
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the event provider by.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function getEventProviderById(
  httpClient: AdobeIoEventsHttpClient,
  params: EventProviderGetByIdParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventProviderGetByIdParamsSchema,
    params,
  );

  const searchParams = new URLSearchParams();
  setQueryParamIfTruthy(
    searchParams,
    "eventmetadata",
    validatedParams.withEventMetadata,
  );

  return httpClient.get(`providers/${params.providerId}`, {
    ...fetchOptions,
    searchParams,
  });
}

/**
 * Creates an event provider.
 * @see https://developer.adobe.com/events/docs/api#operation/createProvider
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the event provider with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function createEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: EventProviderCreateParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(EventProviderCreateParamsSchema, params);
  return httpClient.post(
    `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/providers`,
    {
      ...fetchOptions,
      json: {
        ...validatedParams,

        docs_url: validatedParams.docsUrl,
        provider_metadata: validatedParams.providerType,
        instance_id: validatedParams.instanceId,
        data_residency_region: validatedParams.dataResidencyRegion,
      },
    },
  );
}
