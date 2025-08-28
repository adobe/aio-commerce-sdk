import ky from "ky";

import {
  buildImsAuthBeforeRequestHook,
  isAuthProvider,
} from "~/utils/auth/hooks";
import {
  BASE_IMS_REQUIRED_SCOPES,
  ensureImsScopes,
} from "~/utils/auth/ims-scopes";
import { optionallyExtendKy } from "~/utils/http/ky";

import type { IoEventsHttpClient, IoEventsHttpClientParams } from "./types";

const IO_EVENTS_IMS_REQUIRED_SCOPES = [
  ...BASE_IMS_REQUIRED_SCOPES,
  "event_receiver_api",
];

/**
 * Builds an HTTP client for the Adobe I/O Events API.
 * @param imsAuth - The IMS authentication parameters.
 * @param config - The configuration for the Adobe I/O HTTP client.
 */
export function buildIoEventsHttpClient(
  params: IoEventsHttpClientParams,
): IoEventsHttpClient {
  const { auth, config, fetchOptions } = params;
  const beforeRequestAuthHook = isAuthProvider(auth)
    ? buildImsAuthBeforeRequestHook(auth)
    : buildImsAuthBeforeRequestHook(
        ensureImsScopes(auth, IO_EVENTS_IMS_REQUIRED_SCOPES),
      );

  const adobeIoBaseUrl =
    config.environment === "stage"
      ? "https://api-stage.adobe.io/events"
      : "https://api.adobe.io/events";

  const httpClient = ky.create({
    prefixUrl: adobeIoBaseUrl,
    headers: {
      Accept: "application/hal+json",
    },

    hooks: {
      beforeRequest: [beforeRequestAuthHook],
    },
  });

  const extendedHttpClient = optionallyExtendKy(httpClient, fetchOptions);
  return Object.assign(extendedHttpClient, {
    config,
  });
}
