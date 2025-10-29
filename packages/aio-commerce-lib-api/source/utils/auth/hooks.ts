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

import {
  getImsAuthProvider,
  getIntegrationAuthProvider,
} from "@adobe/aio-commerce-lib-auth";

import type {
  ImsAuthParams,
  ImsAuthProvider,
  IntegrationAuthParams,
  IntegrationAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import type { KyRequest } from "ky";
import type { ImsAuthParamsWithOptionalScopes } from "#utils/auth/ims-scopes";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Type guard to check if the given auth object is an auth provider.
 * @param auth The auth object to check.
 */
export function isAuthProvider(
  auth:
    | ImsAuthParams
    | ImsAuthProvider
    | ImsAuthParamsWithOptionalScopes
    | IntegrationAuthParams
    | IntegrationAuthProvider,
): auth is ImsAuthProvider | IntegrationAuthProvider {
  return "getHeaders" in auth;
}

/**
 * Builds a before request hook for integration authentication.
 * @param integrationAuth The integration authentication parameters or integration auth provider.
 */
export function buildIntegrationAuthBeforeRequestHook(
  integrationAuth: IntegrationAuthParams | IntegrationAuthProvider,
) {
  const integrationAuthProvider = isAuthProvider(integrationAuth)
    ? integrationAuth
    : getIntegrationAuthProvider(integrationAuth);

  return (request: KyRequest) => {
    const headers = integrationAuthProvider.getHeaders(
      request.method.toUpperCase() as HttpMethod,
      request.url,
    );

    request.headers.set("Authorization", headers.Authorization);
  };
}

/**
 * Builds a before request hook for IMS authentication.
 * @param imsAuth The IMS authentication parameters or IMS auth provider.
 */
export function buildImsAuthBeforeRequestHook(
  imsAuth: ImsAuthParams | ImsAuthProvider,
) {
  const imsAuthProvider = isAuthProvider(imsAuth)
    ? imsAuth
    : getImsAuthProvider(imsAuth);

  return async (request: KyRequest) => {
    const headers = await imsAuthProvider.getHeaders();

    request.headers.set("Authorization", headers.Authorization);
    request.headers.set("x-api-key", headers["x-api-key"]);
  };
}
