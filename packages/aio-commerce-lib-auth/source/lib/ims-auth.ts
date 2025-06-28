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

import { context, getToken } from "@adobe/aio-lib-ims";
import { allNonEmpty } from "./params";

const IMS_AUTH_HEADERS = ["Authorization", "x-api-key"] as const;
const IMS_AUTH_PARAMS = [
  "OAUTH_CLIENT_ID",
  "OAUTH_CLIENT_SECRETS",
  "OAUTH_TECHNICAL_ACCOUNT_ID",
  "OAUTH_TECHNICAL_ACCOUNT_EMAIL",
  "OAUTH_IMS_ORG_ID",
  "OAUTH_SCOPES",
  "OAUTH_ENV",
  "OAUTH_CTX",
] as const;

/** Defines a union of allowed IMS authentication parameters. */
export type ImsAuthParam = (typeof IMS_AUTH_PARAMS)[number];

/** Defines a key-value map of IMS authentication parameters. */
export type ImsAuthParams = Partial<Record<ImsAuthParam, string>>;

/** Defines a union of allowed IMS authentication headers. */
export type ImsAuthHeader = (typeof IMS_AUTH_HEADERS)[number];

/** Defines a key-value map of IMS authentication headers. */
export type ImsAuthHeaders = Record<ImsAuthHeader, string>;

type ImsAccessToken = string;

/** Defines an authentication provider for Adobe IMS. */
export interface ImsAuthProvider {
  getHeaders: () => Promise<ImsAuthHeaders>;
  getAccessToken: () => Promise<ImsAccessToken>;
}

/**
 * If the required IMS parameters are present, this function returns an {@link ImsAuthProvider}.
 * @param params includes IMS parameters
 */
export async function getImsAuthProvider(params: ImsAuthParams) {
  const config = resolveImsConfig(params);

  if (config) {
    const contextName = params.OAUTH_CTX ?? "aio-commerce-sdk-creds";
    await context.set(contextName, config);

    return {
      getAccessToken: async () => getToken(contextName, {}),
      getHeaders: async () => {
        const accessToken = await getToken(contextName, {});
        return {
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": config.client_id,
        };
      },
    } satisfies ImsAuthProvider;
  }
}

function resolveImsConfig(params: ImsAuthParams) {
  if (
    allNonEmpty(params, [
      "OAUTH_CLIENT_ID",
      "OAUTH_CLIENT_SECRETS",
      "OAUTH_TECHNICAL_ACCOUNT_ID",
      "OAUTH_TECHNICAL_ACCOUNT_EMAIL",
      "OAUTH_IMS_ORG_ID",
      "OAUTH_SCOPES",
    ])
  ) {
    return {
      client_id: params.OAUTH_CLIENT_ID,
      client_secrets: JSON.parse(
        params.OAUTH_CLIENT_SECRETS ?? "[]",
      ) as string[],
      technical_account_id: params.OAUTH_TECHNICAL_ACCOUNT_ID,
      technical_account_email: params.OAUTH_TECHNICAL_ACCOUNT_EMAIL,
      ims_org_id: params.OAUTH_IMS_ORG_ID,
      scopes: JSON.parse(params.OAUTH_SCOPES ?? "[]") as string[],
      environment: params.OAUTH_ENV ?? "prod",
    };
  }
}
