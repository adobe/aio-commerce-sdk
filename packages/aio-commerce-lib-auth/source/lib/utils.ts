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

import { allNonEmpty } from "@adobe/aio-commerce-lib-core/params";

import { resolveImsAuthParams } from "./ims-auth/utils";
import { resolveIntegrationAuthParams } from "./integration-auth/utils";

import type { ImsAuthParams } from "./ims-auth/schema";
import type { IntegrationAuthParams } from "./integration-auth/schema";

/** IMS authentication parameters with the "ims" strategy indicator. */
export type ImsAuthParamsWithStrategy = ImsAuthParams & { strategy: "ims" };

/** Adobe Commerce Integration authentication parameters with the "integration" strategy indicator. */
export type IntegrationAuthParamsWithStrategy = IntegrationAuthParams & {
  strategy: "integration";
};

/**
 * Union type representing either IMS or Integration authentication providers.
 * Each provider includes its respective parameters and a strategy identifier.
 */
export type AuthProvider =
  | ImsAuthParamsWithStrategy
  | IntegrationAuthParamsWithStrategy;

/**
 * The available authentication resolver strategies.
 * - `"ims"`: Force resolution as IMS authentication
 * - `"integration"`: Force resolution as Adobe Commerce Integration authentication
 * - `"auto"`: Automatically detect the authentication type based on provided parameters
 */
export type AuthResolverStrategy = AuthProvider["strategy"] | "auto";

/** Conditional type that resolves to the correct authentication parameters type based on the strategy. */
type ResolvedAuthParams<T extends AuthResolverStrategy> = T extends "ims"
  ? ImsAuthParamsWithStrategy
  : T extends "integration"
    ? IntegrationAuthParamsWithStrategy
    : AuthProvider;

/**
 * Automatically detects and resolves authentication parameters from App Builder action inputs.
 * Attempts to resolve IMS authentication first, then falls back to Integration authentication.
 *
 * @param params The App Builder action inputs containing authentication parameters.
 * @throws {Error} If neither IMS nor Integration authentication parameters can be resolved.
 */
function resolveAuthParamsAuto(params: Record<string, unknown>): AuthProvider {
  if (
    allNonEmpty(params, [
      "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
      "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
      "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
      "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
      "AIO_COMMERCE_AUTH_IMS_ORG_ID",
      "AIO_COMMERCE_AUTH_IMS_SCOPES",
    ])
  ) {
    return Object.assign(resolveImsAuthParams(params), {
      strategy: "ims",
    } as const);
  }

  if (
    allNonEmpty(params, [
      "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY",
      "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET",
      "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN",
      "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET",
    ])
  ) {
    return Object.assign(resolveIntegrationAuthParams(params), {
      strategy: "integration",
    } as const);
  }

  throw new Error(
    "Can't resolve authentication options for the given params. " +
      "Please provide either IMS options (AIO_COMMERCE_AUTH_IMS_CLIENT_ID, AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS, AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID, AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL, AIO_COMMERCE_AUTH_IMS_ORG_ID, AIO_COMMERCE_AUTH_IMS_SCOPES) " +
      "or Commerce integration options (AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY, AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET, AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN, AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET).",
  );
}

/**
 * Resolves authentication parameters from App Builder action inputs based on the specified strategy.
 * Supports automatic detection or explicit strategy specification for IMS or Integration authentication.
 *
 * @template T The authentication resolver strategy type (defaults to "auto").
 * @param params The App Builder action inputs containing authentication parameters.
 * @param strategy The authentication strategy to use. Defaults to "auto" for automatic detection.
 *
 * @throws {CommerceSdkValidationError} If the parameters are invalid for the specified strategy.
 * @throws {Error} If "auto" strategy is used and neither authentication type can be resolved.
 * @example
 * ```typescript
 * // Automatic detection (will use IMS if IMS params are present, otherwise Integration)
 * export function main(params) {
 *   const authProvider = resolveAuthParams(params);
 *   console.log(authProvider.strategy); // "ims" or "integration"
 * }
 * ```
 * @example
 * ```typescript
 * // Explicit IMS strategy
 * export function main(params) {
 *   const imsAuth = resolveAuthParams(params, "ims");
 *   console.log(imsAuth.strategy); // "ims"
 *   console.log(imsAuth.clientId); // your IMS client ID
 * }
 * ```
 * @example
 * ```typescript
 * // Explicit Integration strategy
 * export function main(params) {
 *   const integrationAuth = resolveAuthParams(params, "integration");
 *   console.log(integrationAuth.strategy); // "integration"
 *   console.log(integrationAuth.consumerKey); // your consumer key
 * }
 * ```
 */
export function resolveAuthParams<T extends AuthResolverStrategy = "auto">(
  params: Record<string, unknown>,
  strategy: T = "auto" as T,
): ResolvedAuthParams<T> {
  const providerMap = {
    ims: resolveImsAuthParams,
    integration: resolveIntegrationAuthParams,
    auto: resolveAuthParamsAuto,
  };

  const provider = providerMap[strategy];
  return provider(params) as ResolvedAuthParams<T>;
}
