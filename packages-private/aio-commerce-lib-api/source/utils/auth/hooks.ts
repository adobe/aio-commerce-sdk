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
