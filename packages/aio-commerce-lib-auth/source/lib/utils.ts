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

import { forwardImsAuthProviderFromParams } from "./ims-auth/provider";
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

const FORWARDED_IMS_PARAMS = [
  "AIO_COMMERCE_IMS_AUTH_TOKEN",
  "AIO_COMMERCE_IMS_AUTH_API_KEY",
] as const satisfies string[];

/**
 * Automatically detects and resolves authentication parameters from App Builder action inputs.
 * Attempts to resolve IMS authentication first, then falls back to Integration authentication.
 *
 * @param params The App Builder action inputs containing authentication parameters.
 * @throws {CommerceSdkValidationError} If the parameters are invalid.
 * @throws {Error} If neither IMS nor Integration authentication parameters can be resolved.
 * @example
 * ```typescript
 * // Automatic detection (will use IMS if IMS params are present, otherwise Integration)
 * export function main(params) {
 *   const authProvider = resolveAuthParams(params);
 *   console.log(authProvider.strategy); // "ims" or "integration"
 * }
 * ```
 */
export function resolveAuthParams(params: Record<string, unknown>) {
  try {
    const provider = forwardImsAuthProviderFromParams(params);
    return { ...provider, strategy: "ims" as const };
  } catch {
    // Do nothing, the needed parameters are not there, try the next method.
  }

  if (allNonEmpty(params, IMS_AUTH_PARAMS)) {
    const provider = resolveImsAuthParams(params);
    return { ...provider, strategy: "ims" as const };
  }

  if (allNonEmpty(params, INTEGRATION_AUTH_PARAMS)) {
    const provider = resolveIntegrationAuthParams(params);
    return { ...provider, strategy: "integration" as const };
  }

  throw new Error(
    "Can't resolve authentication options for the given params. " +
      `Please provide either a pre-created token and (optionally) an API key (${FORWARDED_IMS_PARAMS.join(",")})` +
      `or IMS options (${IMS_AUTH_PARAMS.join(", ")}) ` +
      `or Commerce integration options (${INTEGRATION_AUTH_PARAMS.join(", ")}).`,
  );
}
