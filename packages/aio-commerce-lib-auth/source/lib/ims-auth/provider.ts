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

import aioLibIms from "@adobe/aio-lib-ims";

import type { SnakeCasedProperties } from "type-fest";
import type { ImsAuthEnv, ImsAuthParams } from "./schema";

/** Defines the header keys used for IMS authentication. */
type ImsAuthHeader = "Authorization" | "x-api-key";

/** Defines the headers required for IMS authentication. */
type ImsAuthHeaders = Record<ImsAuthHeader, string>;

/** Defines an authentication provider for Adobe IMS. */
export type ImsAuthProvider = {
  getAccessToken: () => Promise<string>;
  getHeaders: () => Promise<ImsAuthHeaders>;
};

/** The shape of the configuration expected by `aio-lib-ims`. */
type ImsAuthConfig = Omit<
  SnakeCasedProperties<ImsAuthParams>,
  "environment"
> & {
  env: ImsAuthEnv;
  context: string;
};

const { context, getToken } = aioLibIms;
/**
 * Converts IMS auth configuration properties to snake_case format.
 * @param config The IMS auth configuration with camelCase properties.
 * @returns The configuration with snake_case properties.
 */
function toImsAuthConfig(config: ImsAuthParams): ImsAuthConfig {
  return {
    scopes: config.scopes,
    env: config?.environment ?? "prod",
    context: config.context ?? "aio-commerce-lib-auth-creds",
    client_id: config.clientId,
    client_secrets: config.clientSecrets,
    technical_account_id: config.technicalAccountId,
    technical_account_email: config.technicalAccountEmail,
    ims_org_id: config.imsOrgId,
  };
}

/**
 * Creates an {@link ImsAuthProvider} based on the provided configuration.
 * @param authParams An {@link ImsAuthParams} parameter that contains the configuration for the {@link ImsAuthProvider}.
 * @returns An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.
 * @example
 * ```typescript
 * const config = {
 *   clientId: "your-client-id",
 *   clientSecrets: ["your-client-secret"],
 *   technicalAccountId: "your-technical-account-id",
 *   technicalAccountEmail: "your-account@example.com",
 *   imsOrgId: "your-ims-org-id@AdobeOrg",
 *   scopes: ["AdobeID", "openid"],
 *   environment: "prod",
 *   context: "my-app-context"
 * };
 *
 * const authProvider = getImsAuthProvider(config);
 *
 * // Get access token
 * const token = await authProvider.getAccessToken();
 * console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
 *
 * // Get headers for API requests
 * const headers = await authProvider.getHeaders();
 * console.log(headers);
 * // {
 * //   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
 * //   "x-api-key": "your-client-id"
 * // }
 *
 * // Use headers in API calls
 * const response = await fetch('https://api.adobe.io/some-endpoint', {
 *   headers: await authProvider.getHeaders()
 * });
 * ```
 */
export function getImsAuthProvider(authParams: ImsAuthParams) {
  const getAccessToken = async () => {
    const imsAuthConfig = toImsAuthConfig(authParams);

    await context.set(imsAuthConfig.context, imsAuthConfig);
    return getToken(imsAuthConfig.context, {});
  };

  const getHeaders = async () => {
    const accessToken = await getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": authParams.clientId,
    };
  };

  return {
    getAccessToken,
    getHeaders,
  };
}
