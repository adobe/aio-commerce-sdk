import { parseOrThrow } from "#utils/valibot";

import { UpdateEventingConfigurationParamsSchema } from "./schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { AdobeCommerceHttpClient } from "@aio-commerce-sdk/aio-commerce-lib-api";
import type {
  HTTPError,
  Options,
} from "@aio-commerce-sdk/aio-commerce-lib-api/ky";
import type { UpdateEventingConfigurationParams } from "./schema";

/**
 * Updates the configuration of the Commerce Eventing API.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#configure-commerce-eventing
 *
 * @param httpClient - The {@link CommerceHttpClient} to use to make the request.
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
