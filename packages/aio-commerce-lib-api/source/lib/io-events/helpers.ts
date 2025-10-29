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

import ky from "ky";

import {
  buildImsAuthBeforeRequestHook,
  isAuthProvider,
} from "#utils/auth/hooks";
import { ensureImsScopes } from "#utils/auth/ims-scopes";
import { optionallyExtendKy } from "#utils/http/ky";

import type { IoEventsHttpClientParamsWithRequiredConfig } from "./http-client";

const IO_EVENTS_IMS_REQUIRED_SCOPES = ["adobeio_api"];

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
