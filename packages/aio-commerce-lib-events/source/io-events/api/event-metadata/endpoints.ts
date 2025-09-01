import { parseOrThrow } from "~/utils/valibot";

import {
  CreateEventMetadataForProviderSchema,
  GetAllEventMetadataForProviderSchema,
  GetEventMetadataForEventAndProviderSchema,
} from "./schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { AdobeIoEventsHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";
import type { HTTPError, Options } from "ky";
import type {
  CreateEventMetadataForProviderParams,
  GetAllEventMetadataForProviderParams,
  GetEventMetadataForEventAndProviderParams,
} from "./schema";

/**
 * Gets all event metadata for a specific provider.
 * @see https://developer.adobe.com/events/docs/api#operation/getByProviderId
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the event metadata with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function getAllEventMetadataForProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: GetAllEventMetadataForProviderParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    GetAllEventMetadataForProviderSchema,
    params,
  );

  const endpoint = `providers/${validatedParams.providerId}/eventmetadata`;
  return httpClient.get(endpoint, fetchOptions);
}

/**
 * Gets event metadata for a specific event code and provider.
 * @see https://developer.adobe.com/events/docs/api#operation/getByProviderIdAndEventCode
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to get the event metadata with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function getEventMetadataForEventAndProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: GetEventMetadataForEventAndProviderParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    GetEventMetadataForEventAndProviderSchema,
    params,
  );

  const endpoint = `providers/${validatedParams.providerId}/eventmetadata/${validatedParams.eventCode}`;
  return httpClient.get(endpoint, fetchOptions);
}

/**
 * Creates event metadata for a provider.
 * @see https://developer.adobe.com/events/docs/api#operation/postEventMetadata
 *
 * @param httpClient - The {@link AdobeIoEventsHttpClient} to use to make the request.
 * @param params - The parameters to create the event metadata with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function createEventMetadataForProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: CreateEventMetadataForProviderParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    CreateEventMetadataForProviderSchema,
    params,
  );

  const endpoint = `${validatedParams.consumerOrgId}/${validatedParams.projectId}/${validatedParams.workspaceId}/providers/${validatedParams.providerId}/eventmetadata`;
  const body = {
    label: validatedParams.label,
    description: validatedParams.description,
    event_code: validatedParams.eventCode,
    sample_event_template: validatedParams.sampleEventTemplate,
  };

  return httpClient.post(endpoint, {
    ...fetchOptions,
    json: body,
  });
}
