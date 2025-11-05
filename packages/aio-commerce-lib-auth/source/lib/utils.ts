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

const IMS_AUTH_PARAMS = [
  "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  "AIO_COMMERCE_AUTH_IMS_ORG_ID",
  "AIO_COMMERCE_AUTH_IMS_SCOPES",
] as const satisfies string[];

const INTEGRATION_AUTH_PARAMS = [
  "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY",
  "AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET",
  "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN",
  "AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET",
] as const satisfies string[];

const AUTH_PARAMS_RESOLVER_MAP = {
  ims: resolveImsAuthParams,
  integration: resolveIntegrationAuthParams,
  auto: resolveAuthParamsAuto,
};

type AuthResolverStrategy = "ims" | "integration" | "auto";

/**
 * Automatically detects and resolves authentication parameters from App Builder action inputs.
 * Attempts to resolve IMS authentication first, then falls back to Integration authentication.
 *
 * @param params The App Builder action inputs containing authentication parameters.
 * @throws {Error} If neither IMS nor Integration authentication parameters can be resolved.
 */
function resolveAuthParamsAuto(params: Record<string, unknown>) {
  if (allNonEmpty(params, IMS_AUTH_PARAMS)) {
    return Object.assign(resolveImsAuthParams(params), {
      strategy: "ims",
    } as const);
  }

  if (allNonEmpty(params, INTEGRATION_AUTH_PARAMS)) {
    return Object.assign(resolveIntegrationAuthParams(params), {
      strategy: "integration",
    } as const);
  }

  throw new Error(
    "Can't resolve authentication options for the given params. " +
      `Please provide either IMS options (${IMS_AUTH_PARAMS.join(", ")}) ` +
      `or Commerce integration options (${INTEGRATION_AUTH_PARAMS.join(", ")}).`,
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
) {
  const provider = AUTH_PARAMS_RESOLVER_MAP[strategy];
  return provider(params);
}
