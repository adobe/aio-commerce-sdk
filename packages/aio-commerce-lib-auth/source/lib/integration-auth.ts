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
import {
  type Failure,
  fail,
  type Success,
  succeed,
  type ValidationErrorType,
} from "@adobe/aio-commerce-lib-core";
import OAuth1a from "oauth-1.0a";
import { safeParse } from "valibot";
import {
  type HttpMethodInput,
  type IntegrationAuthHeaders,
  type IntegrationAuthParamsInput,
  type IntegrationAuthProvider,
  type IntegrationConfig,
  integrationAuthParamsParser,
  type UriInput,
  UrlSchema,
} from "~/lib/integration-auth/integration-auth-types";

export function getIntegrationAuthProvider(config: IntegrationConfig) {
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
    getHeaders(method: HttpMethodInput, url: UriInput) {
      const validationHeaders = safeParse(UrlSchema, url);
      if (!validationHeaders.success) {
        return fail({
          _tag: "ValidationError",
          issues: validationHeaders.issues,
          message:
            "Failed to validate the provided URL. See the console for more details.",
        }) satisfies Failure<ValidationErrorType>;
      }

      let finalUrl: string;
      if (url instanceof URL) {
        finalUrl = url.toString();
      } else {
        finalUrl = url;
      }

      return succeed(
        oauth.toHeader(oauth.authorize({ url: finalUrl, method }, oauthToken)),
      ) satisfies Success<IntegrationAuthHeaders>;
    },
  } satisfies IntegrationAuthProvider;
}

export function tryGetIntegrationAuthProvider(
  params: IntegrationAuthParamsInput,
) {
  const validation = integrationAuthParamsParser(params);

  if (!validation.success) {
    return fail({
      _tag: "ValidationError",
      issues: validation.issues,
      message:
        "Failed to validate the provided integration parameters. See the console for more details.",
    }) satisfies Failure<ValidationErrorType>;
  }

  return succeed(
    getIntegrationAuthProvider(resolveIntegrationConfig(validation.output)),
  ) satisfies Success<IntegrationAuthProvider>;
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
