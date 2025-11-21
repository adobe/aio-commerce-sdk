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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParse } from "valibot";

import { IntegrationAuthParamsSchema } from "./schema";

import type { IntegrationAuthProvider } from "./provider";
import type { IntegrationAuthParams } from "./schema";

/**
 * Parses the provided configuration for an {@link IntegrationAuthProvider}.
 * @param config - The configuration to parse.
 * @throws {CommerceSdkValidationError} If the configuration is invalid.
 *
 * @internal
 */
function __parseIntegrationAuthParams(config: unknown) {
  const result = safeParse(IntegrationAuthParamsSchema, config);
  if (!result.success) {
    throw new CommerceSdkValidationError(
      "Invalid IntegrationAuthProvider configuration",
      {
        issues: result.issues,
      },
    );
  }

  return result.output;
}
/**
 * Asserts the provided configuration for an Adobe Commerce {@link IntegrationAuthProvider}.
 * @param config The configuration to validate.
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
 * ```
 * @example
 * ```typescript
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
  // Run the parsing but discard the result
  // This will throw if the configuration is invalid
  __parseIntegrationAuthParams(config);
}

/**
 * Resolves an {@link IntegrationAuthParams} from the given App Builder action inputs.
 * @param params The App Builder action inputs to resolve the Integration authentication parameters from.
 * @throws {CommerceSdkValidationError} If the parameters are invalid and cannot be resolved.
 *
 * @example
 * ```typescript
 * export function main(params) {
 *   const resolvedParams = resolveIntegrationAuthParams(params);
 *   console.log(resolvedParams); // { consumerKey: "your-consumer-key", consumerSecret: "your-consumer-secret", accessToken: "your-access-token", accessTokenSecret: "your-access-token-secret" }
 * }
 * ```
 */
export function resolveIntegrationAuthParams(
  params: Record<string, unknown>,
): IntegrationAuthParams {
  const resolvedParams = {
    consumerKey: params.AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY,
    consumerSecret: params.AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET,
    accessToken: params.AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN,
    accessTokenSecret: params.AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET,
  };

  return __parseIntegrationAuthParams(resolvedParams);
}
