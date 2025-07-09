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

import { err, ok, type Result } from "@adobe/aio-commerce-lib-core/result";
import type { ValidationErrorType } from "@adobe/aio-commerce-lib-core/validation";

import OAuth1a from "oauth-1.0a";
import { type InferIssue, safeParse } from "valibot";

import {
  type AdobeCommerceUri,
  type HttpMethodInput,
  type IntegrationAuthParams,
  IntegrationAuthParamsSchema,
  UrlSchema,
} from "./schema";

type IntegrationAuthHeader = "Authorization";
type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

/** Defines the configuration to create an {@link IntegrationAuthProvider}. */
export interface IntegrationConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

type ValidationIssues =
  | InferIssue<typeof IntegrationAuthParamsSchema>[]
  | InferIssue<typeof UrlSchema>[];

/** Defines an error type for the integration auth service. */
export type IntegrationAuthError = ValidationErrorType<
  "IntegrationAuthValidationError",
  ValidationIssues
>;

/** Defines an authentication provider for Adobe Commerce integrations. */
export interface IntegrationAuthProvider {
  getHeaders: (
    method: HttpMethodInput,
    url: AdobeCommerceUri,
  ) => Result<IntegrationAuthHeaders, IntegrationAuthError>;
}

function makeIntegrationAuthValidationError(
  message: string,
  issues: ValidationIssues,
) {
  return {
    _tag: "IntegrationAuthValidationError",
    message,
    issues,
  } satisfies IntegrationAuthError;
}

function fromParams(params: IntegrationAuthParams) {
  return {
    consumerKey: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY,
    consumerSecret: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET,
    accessToken: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN,
    accessTokenSecret: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET,
  } satisfies IntegrationConfig;
}

/**
 * Creates an {@link IntegrationAuthProvider} based on the provided configuration.
 * @param config The configuration for the integration.
 * @returns An {@link IntegrationAuthProvider} instance that can be used to get auth headers.
 */
export function getIntegrationAuthProvider(
  config: IntegrationConfig,
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

  const getHeaders = (method: HttpMethodInput, url: AdobeCommerceUri) => {
    const uriValidation = safeParse(UrlSchema, url);
    if (!uriValidation.success) {
      return err(
        makeIntegrationAuthValidationError(
          "Failed to validate the provided Adobe Commerce URL",
          uriValidation.issues,
        ),
      );
    }

    const finalUrl = uriValidation.output;
    const headers = oauth.toHeader(
      oauth.authorize({ url: finalUrl, method }, oauthToken),
    );

    return ok(headers);
  };

  return {
    getHeaders,
  };
}

/**
 * Tries to create an {@link IntegrationAuthProvider} based on the provided parameters.
 * @param params The parameters required for integration authentication.
 * @returns An {@link IntegrationAuthProvider} instance that can be used to get auth headers.
 */
export function tryGetIntegrationAuthProvider(
  params: IntegrationAuthParams,
): Result<IntegrationAuthProvider, IntegrationAuthError> {
  const validation = safeParse(IntegrationAuthParamsSchema, params);

  if (!validation.success) {
    return err(
      makeIntegrationAuthValidationError(
        "Failed to validate the provided integration parameters",
        validation.issues,
      ),
    );
  }

  return ok(getIntegrationAuthProvider(fromParams(validation.output)));
}
