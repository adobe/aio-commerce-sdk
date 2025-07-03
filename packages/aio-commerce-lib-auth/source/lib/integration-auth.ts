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

import crypto from "node:crypto";
import OAuth1a from "oauth-1.0a";

import { allNonEmpty } from "./params";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const INTEGRATION_AUTH_HEADERS = ["Authorization"] as const;
const INTEGRATION_AUTH_PARAMS = [
  "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
  "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
  "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
  "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
] as const;

/** Defines a union of allowed integration authentication parameters. */
export type IntegrationAuthParam = (typeof INTEGRATION_AUTH_PARAMS)[number];

/** Defines a key-value map of integration authentication parameters. */
export type IntegrationAuthParams = Partial<
  Record<IntegrationAuthParam, string>
>;

/** Defines a union of allowed integration authentication headers. */
export type IntegrationAuthHeader = (typeof INTEGRATION_AUTH_HEADERS)[number];

/** Defines a key-value map of integration authentication headers. */
export type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

type HttpMethod = (typeof HTTP_METHODS)[number];

/** Defines an authentication provider for integration authentication. */
export interface IntegrationAuthProvider {
  getHeaders: (method: HttpMethod, url: string) => IntegrationAuthHeaders;
}

/**
 * If the required integration parameters are present, this function returns an {@link IntegrationAuthProvider}.
 * @param params includes integration parameters
 */
export function getIntegrationAuthProvider(params: IntegrationAuthParams) {
  const config = resolveIntegrationConfig(params);

  if (config) {
    const oauth = new OAuth1a({
      consumer: {
        key: config.consumerKey,
        secret: config.consumerSecret,
      },
      signature_method: "HMAC-SHA256",
      hash_function: (baseString, key) =>
        crypto.createHmac("sha256", key).update(baseString).digest("base64"),
    });

    const oauthToken = {
      key: config.accessToken,
      secret: config.accessTokenSecret,
    };

    return {
      getHeaders(method: HttpMethod, url: string) {
        return oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
      },
    } satisfies IntegrationAuthProvider;
  }
}

function resolveIntegrationConfig(params: IntegrationAuthParams) {
  if (
    allNonEmpty(params, [
      "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
      "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
      "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
      "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
    ])
  ) {
    return {
      consumerKey: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY,
      consumerSecret: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET,
      accessToken: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN,
      accessTokenSecret: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET,
    };
  }
}
