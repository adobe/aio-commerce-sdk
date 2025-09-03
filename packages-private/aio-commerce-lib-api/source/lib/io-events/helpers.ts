import ky from "ky";

import {
  buildImsAuthBeforeRequestHook,
  isAuthProvider,
} from "#utils/auth/hooks";
import { ensureImsScopes } from "#utils/auth/ims-scopes";
import { optionallyExtendKy } from "#utils/http/ky";

import type { IoEventsHttpClientParamsWithRequiredConfig } from "./http-client";

const IO_EVENTS_IMS_REQUIRED_SCOPES = [
  "openid, AdobeID, event_receiver_api, read_organizations",
];

/**
 * Builds the Adobe I/O Events HTTP client for the given parameters.
 * @param params The configuration, authentication and fetch options parameters.
 */
export function buildIoEventsHttpClient(
  params: IoEventsHttpClientParamsWithRequiredConfig,
) {
  const { auth, config, fetchOptions } = params;
  const beforeRequestAuthHook = isAuthProvider(auth)
    ? buildImsAuthBeforeRequestHook(auth)
    : buildImsAuthBeforeRequestHook(
        ensureImsScopes(auth, IO_EVENTS_IMS_REQUIRED_SCOPES),
      );

  const adobeIoBaseUrl = config.baseUrl;
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
