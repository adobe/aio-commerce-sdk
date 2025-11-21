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

import { ImsAuthParamsSchema } from "./schema";

import type { ImsAuthProvider } from "./provider";
import type { ImsAuthParams } from "./schema";

/**
 * Parses the provided configuration for an {@link ImsAuthProvider}.
 * @param config - The configuration to parse.
 * @throws {CommerceSdkValidationError} If the configuration is invalid.
 *
 * @internal
 */
function __parseImsAuthParams(config: unknown) {
  const result = safeParse(ImsAuthParamsSchema, config);
  if (!result.success) {
    throw new CommerceSdkValidationError(
      "Invalid ImsAuthProvider configuration",
      {
        issues: result.issues,
      },
    );
  }

  return result.output;
}
/**
 * Asserts the provided configuration for an {@link ImsAuthProvider}.
 * @param config The configuration to validate.
 * @throws {CommerceSdkValidationError} If the configuration is invalid.
 * @example
 * ```typescript
 * const config = {
 *   clientId: "your-client-id",
 *   clientSecrets: ["your-client-secret"],
 *   technicalAccountId: "your-technical-account-id",
 *   technicalAccountEmail: "your-account@example.com",
 *   imsOrgId: "your-ims-org-id@AdobeOrg",
 *   scopes: ["AdobeID", "openid"],
 *   environment: "prod", // or "stage"
 *   context: "my-app-context"
 * };
 *
 * // This will validate the config and throw if invalid
 * assertImsAuthParams(config);
 *```
 * @example
 * ```typescript
 * // Example of a failing assert:
 * try {
 *   assertImsAuthParams({
 *     clientId: "valid-client-id",
 *     // Missing required fields like clientSecrets, technicalAccountId, etc.
 *   });
 * } catch (error) {
 *   console.error(error.message); // "Invalid ImsAuthProvider configuration"
 *   console.error(error.issues); // Array of validation issues
 * }
 * ```
 */
export function assertImsAuthParams(
  config: Record<PropertyKey, unknown>,
): asserts config is ImsAuthParams {
  // Run the parsing but discard the result
  // This will throw if the configuration is invalid
  __parseImsAuthParams(config);
}

/**
 * Resolves an {@link ImsAuthParams} from the given App Builder action inputs.
 * @param params The App Builder action inputs to resolve the IMS authentication parameters from.
 * @throws {CommerceSdkValidationError} If the parameters are invalid and cannot be resolved.
 *
 * @example
 * ```typescript
 * // Some App Builder runtime action that needs IMS authentication
 * export function main(params) {
 *   const imsAuthProvider = getImsAuthProvider(resolveImsAuthParams(params));
 *
 *   // Get headers for API requests
 *   const headers = await authProvider.getHeaders();
 *   const response = await fetch('https://api.adobe.io/some-endpoint', {
 *     headers: await authProvider.getHeaders()
 *   });
 * }
 * ```
 */
export function resolveImsAuthParams(
  params: Record<string, unknown>,
): ImsAuthParams {
  const resolvedParams = {
    clientId: params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
    clientSecrets: params.AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS,
    technicalAccountId: params.AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID,
    technicalAccountEmail: params.AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL,
    imsOrgId: params.AIO_COMMERCE_AUTH_IMS_ORG_ID,
    scopes: params.AIO_COMMERCE_AUTH_IMS_SCOPES,

    // These are optional, if not set will be defaulted in future use of `getHeaders` or `getAccessToken`
    environment: params.AIO_COMMERCE_AUTH_IMS_ENVIRONMENT,
    context: params.AIO_COMMERCE_AUTH_IMS_CONTEXT,
  };

  return __parseImsAuthParams(resolvedParams);
}
