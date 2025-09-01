import { parseOrThrow } from "~/utils/valibot";

import { EventSubscriptionCreateParamsSchema } from "./schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { AdobeCommerceHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";
import type { HTTPError, Options } from "ky";
import type { EventSubscriptionCreateParams } from "./schema";

/**
 * Gets all event subscriptions in the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-a-list-of-all-subscribed-events
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param fetchOptions - The {@link Options} to use to make the request.
 */
export function getAllEventSubscriptions(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
) {
  const endpoint = "eventing/getEventSubscriptions";
  return httpClient.get(endpoint, fetchOptions);
}

/**
 * Creates an event subscription in the Commerce instance bound to the given {@link AdobeCommerceHttpClient}.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#subscribe-to-events
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The parameters to create the event subscription with.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export function createEventSubscription(
  httpClient: AdobeCommerceHttpClient,
  params: EventSubscriptionCreateParams,
  fetchOptions?: Options,
) {
  const validatedParams = parseOrThrow(
    EventSubscriptionCreateParamsSchema,
    params,
  );

  const { force, ...event } = validatedParams;
  const endpoint = "eventing/eventSubscribe";

  return httpClient.post(endpoint, {
    ...fetchOptions,
    json: {
      force,
      event: {
        ...event,

        hipaa_audit_required: event.hipaaAuditRequired,
        priority: event.prioritary,
        provider_id: event.providerId,
      },
    },
  });
}
