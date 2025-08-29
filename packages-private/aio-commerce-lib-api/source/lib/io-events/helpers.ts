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

import type { IoEventsHttpClientParams } from "./types";

const IO_EVENTS_IMS_REQUIRED_SCOPES = [
  ...BASE_IMS_REQUIRED_SCOPES,
  "event_receiver_api",
];

/**
 * Builds the Adobe I/O Events HTTP client for the given parameters.
 * @param params The configuration, authentication and fetch options parameters.
 */
export function buildIoEventsHttpClient(params: IoEventsHttpClientParams) {
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

  return optionallyExtendKy(httpClient, fetchOptions);
}
