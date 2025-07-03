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
import {
  entriesFromList,
  type InferInput,
  instance,
  nonEmpty,
  nonOptional,
  object,
  picklist,
  pipe,
  safeParse,
  safeParser,
  string,
  union,
  message as vMessage,
  url as vUrl,
} from "valibot";
import { Result } from "~/lib/result";
import { ValidationError, type ValidationErrorType } from "./utils";

/**
 * The HTTP methods supported by Commerce.
 * This is used to determine which headers to include in the signing of the authorization header.
 */
const AllowedHttpMethod = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export const HttpMethodSchema = picklist(AllowedHttpMethod);
export type HttpMethodInput = InferInput<typeof HttpMethodSchema>;

const BaseUrlSchema = pipe(
  string(),
  nonEmpty("Missing commerce endpoint"),
  vUrl("The url is badly formatted."),
);

const UrlSchema = union([BaseUrlSchema, instance(URL)]);
export type UriInput = InferInput<typeof UrlSchema>;

const IntegrationAuthParamKeys = [
  "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
  "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
  "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
  "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
];

export const IntegrationAuthParamsSchema = nonOptional(
  vMessage(
    object(
      entriesFromList(
        IntegrationAuthParamKeys,
        pipe(string(), nonEmpty("Missing commerce integration parameter")),
      ),
    ),
    (issue) => {
      return `Missing or invalid commerce integration parameter ${issue.expected}`;
    },
  ),
);

export const integrationAuthParamsParser = safeParser(
  IntegrationAuthParamsSchema,
);

export type IntegrationAuthParamsInput = InferInput<
  typeof IntegrationAuthParamsSchema
>;

export type IntegrationAuthHeader = "Authorization";
export type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

export interface IntegrationConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface IntegrationAuthProvider {
  getHeaders: (
    method: HttpMethodInput,
    url: UriInput,
  ) => IntegrationAuthHeaders;
}

export type IntegrationAuthProviderResult = Result<
  IntegrationAuthProvider,
  ValidationErrorType<unknown>
>;

/**
 * If the required integration parameters are present, this function returns an IntegrationAuthProvider.
 * @param {IntegrationConfig} config includes integration parameters
 * @returns {IntegrationAuthProviderResult} Result<IntegrationAuthProvider, ValidationError>
 */
export function getIntegrationAuthProviderWithConfig(
  config: IntegrationConfig,
): IntegrationAuthProviderResult {
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

  return Result.success({
    getHeaders(method, url) {
      const validationHeaders = safeParse(UrlSchema, url);
      if (!validationHeaders.success) {
        throw new ValidationError(
          "Failed to validate the provided commerce URL. See the console for more details.",
          validationHeaders.issues,
        );
      }

      let finalUrl: string;
      if (url instanceof URL) {
        finalUrl = url.toString();
      } else {
        finalUrl = url;
      }

      return oauth.toHeader(
        oauth.authorize({ url: finalUrl, method }, oauthToken),
      );
    },
  });
}

/**
 * If the required integration parameters are present, this function returns an IntegrationAuthProvider.
 * @param {IntegrationAuthParamsInput} params includes integration parameters
 * @returns {IntegrationAuthProviderResult} Result<IntegrationAuthProvider, ValidationError>
 */
export function getIntegrationAuthProviderWithParams(
  params: IntegrationAuthParamsInput,
): IntegrationAuthProviderResult {
  const validation = safeParse(IntegrationAuthParamsSchema, params);

  if (!validation.success) {
    return Result.fail({
      _tag: "ValidationError",
      message:
        "Failed to validate the provided integration parameters. See the console for more details.",
      issues: validation.issues,
    });
  }

  const config = resolveIntegrationConfig(validation.output);
  return getIntegrationAuthProviderWithConfig(config);
}

export function resolveIntegrationConfig(
  params: IntegrationAuthParamsInput,
): IntegrationConfig {
  return {
    consumerKey: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY,
    consumerSecret: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET,
    accessToken: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN,
    accessTokenSecret: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET,
  };
}
