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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/validation";

import OAuth1a from "oauth-1.0a";
import { safeParse } from "valibot";

import {
  type HttpMethodInput,
  type IntegrationAuthParams,
  IntegrationAuthParamsSchema,
} from "./schema";

/** Defines the header key used for Commerce Integration authentication. */
type IntegrationAuthHeader = "Authorization";

/** Defines the headers required for Commerce Integration authentication. */
type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

/** Represents a URL for Adobe Commerce endpoints, accepting either string or URL object. */
export type AdobeCommerceUrl = string | URL;

/** Defines an authentication provider for Adobe Commerce integrations. */
export interface IntegrationAuthProvider {
  getHeaders: (
    method: HttpMethodInput,
    url: AdobeCommerceUrl,
  ) => IntegrationAuthHeaders;
}

/**
 * Asserts the provided configuration for an Adobe Commerce integration authentication provider. {@link IntegrationAuthParams}
 * {@link IntegrationAuthProvider}
 * @param config {Record<PropertyKey, unknown>} The configuration to validate.
 * @throws {CommerceSdkValidationError} If the configuration is invalid.
 * @example
 * ```typescript
 * const config = {
 *   consumerKey: "your-consumer-key",
 *   consumerSecret: "your-consumer-secret",
 *   accessToken: "your-access-token",
 *   accessTokenSecret: "your-access-token-secret"
 * };
 *
 * // This will validate the config and throw if invalid
 * assertIntegrationAuthParams(config);
 *
 * // Example of a failing assert:
 * try {
 *   assertIntegrationAuthParams({
 *     consumerKey: "valid-consumer-key",
 *     // Missing required fields like consumerSecret, accessToken, accessTokenSecret
 *   });
 * } catch (error) {
 *   console.error(error.message); // "Invalid IntegrationAuthProvider configuration"
 *   console.error(error.issues); // Array of validation issues
 * }
 * ```
 */
export function assertIntegrationAuthParams(
  config: Record<PropertyKey, unknown>,
): asserts config is IntegrationAuthParams {
  const result = safeParse(IntegrationAuthParamsSchema, config);
  if (!result.success) {
    throw new CommerceSdkValidationError(
      "Invalid IntegrationAuthProvider configuration",
      {
        issues: result.issues,
      },
    );
  }
}

/**
 * Creates an {@link IntegrationAuthProvider} based on the provided configuration.
 * @param config {IntegrationAuthParams} The configuration for the integration.
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
  config: IntegrationAuthParams,
): IntegrationAuthProvider {
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
    getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) => {
      const urlString = url instanceof URL ? url.toString() : url;
      return oauth.toHeader(
        oauth.authorize({ url: urlString, method }, oauthToken),
      );
    },
  };
}
