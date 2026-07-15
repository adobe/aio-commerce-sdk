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
import { parse } from "valibot";

import { UrlSchema } from "./schema";

import type { HttpMethodInput, IntegrationAuthParams } from "./schema";

/** Defines the header key used for Commerce Integration authentication. */
type IntegrationAuthHeader = "Authorization";

/** Defines the headers required for Commerce Integration authentication. */
type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

/** Represents a URL for Adobe Commerce endpoints, accepting either string or URL object. */
export type AdobeCommerceUrl = string | URL;

/** Defines an authentication provider for Adobe Commerce integrations. */
export type IntegrationAuthProvider = {
  getHeaders: (
    method: HttpMethodInput,
    url: AdobeCommerceUrl,
  ) => IntegrationAuthHeaders;
};

/**
 * Type guard to check if a value is an IntegrationAuthProvider instance.
 *
 * @param provider The value to check.
 * @returns `true` if the value is an IntegrationAuthProvider, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { getIntegrationAuthProvider, isIntegrationAuthProvider } from "@adobe/aio-commerce-lib-auth";
 *
 * // Imagine you have an object that it's not strictly typed as IntegrationAuthProvider.
 * const provider = getIntegrationAuthProvider({ ... }) as unknown;
 *
 * if (isIntegrationAuthProvider(provider)) {
 *   // TypeScript knows provider is IntegrationAuthProvider
 *   const headers = provider.getHeaders("GET", "https://api.example.com");
 * }
 * ```
 */
export function isIntegrationAuthProvider(
  provider: unknown,
): provider is IntegrationAuthProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    "getHeaders" in provider &&
    typeof provider.getHeaders === "function"
  );
}

/**
 * Creates an {@link IntegrationAuthProvider} based on the provided configuration.
 * @param authParams The configuration for the integration.
 * @returns An {@link IntegrationAuthProvider} instance that can be used to get auth headers.
 * @example
 * ```typescript
 * const config = {
 *   consumerKey: "your-consumer-key",
 *   consumerSecret: "your-consumer-secret",
 *   accessToken: "your-access-token",
 *   accessTokenSecret: "your-access-token-secret"
 * };
 *
 * const authProvider = getIntegrationAuthProvider(config);
 *
 * // Get OAuth headers for a REST API call
 * const headers = authProvider.getHeaders("GET", "https://your-store.com/rest/V1/products");
 * console.log(headers); // { Authorization: "OAuth oauth_consumer_key=..., oauth_signature=..." }
 *
 * // Can also be used with URL objects
 * const url = new URL("https://your-store.com/rest/V1/customers");
 * const postHeaders = authProvider.getHeaders("POST", url);
 * ```
 */
export function getIntegrationAuthProvider(
  authParams: IntegrationAuthParams,
): IntegrationAuthProvider {
  const oauth = new OAuth1a({
    consumer: {
      key: authParams.consumerKey,
      secret: authParams.consumerSecret,
    },
    hash_function: (baseString, key) =>
      crypto.createHmac("sha256", key).update(baseString).digest("base64"),
    signature_method: "HMAC-SHA256",
  });

  const oauthToken = {
    key: authParams.accessToken,
    secret: authParams.accessTokenSecret,
  };

  return {
    getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) => {
      const parsed = new URL(parse(UrlSchema, url));

      // OAuth 1.0a signs the request parameters (RFC 5849 §3.4.1.3) merged into
      // the base string (§3.4.1.1); the base-string URI itself excludes the
      // query (§3.4.1.2). oauth-1.0a normally derives those parameters from the
      // URL via `deParam`, which decodes parameter values but NOT keys — so
      // percent-encoded keys (e.g. `searchCriteria%5B...%5D`) get double-encoded
      // in the base string and Adobe Commerce rejects the request with "The
      // signature is invalid.". Instead we decode the query with URLSearchParams
      // (keys and values) and pass it as `request.data`, which oauth-1.0a folds
      // into the very same parameter string (getParameterString merges `data`) —
      // so the params stay signed, just sourced correctly — and we sign against
      // the query-less base URI. Repeated keys collapse to an array, matching
      // oauth-1.0a's own multi-value handling.
      const data: Record<string, string | string[]> = {};
      for (const [key, value] of parsed.searchParams) {
        const existing = data[key];
        if (existing === undefined) {
          data[key] = value;
        } else {
          data[key] = Array.isArray(existing)
            ? [...existing, value]
            : [existing, value];
        }
      }

      const baseUri = `${parsed.origin}${parsed.pathname}`;
      return oauth.toHeader(
        oauth.authorize({ data, method, url: baseUri }, oauthToken),
      );
    },
  };
}
