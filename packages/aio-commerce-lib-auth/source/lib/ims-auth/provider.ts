import type { ErrorType } from "@adobe/aio-commerce-lib-core/result";
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/validation";
import { context, getToken } from "@adobe/aio-lib-ims";

import type { SnakeCasedProperties } from "type-fest";
import { safeParse } from "valibot";

import { type ImsAuthParams, ImsAuthParamsSchema } from "./schema";

/** Defines the header keys used for IMS authentication. */
type ImsAuthHeader = "Authorization" | "x-api-key";

/** Defines the headers required for IMS authentication. */
type ImsAuthHeaders = Record<ImsAuthHeader, string>;

/** Defines an error type for the IMS auth service. */
export type ImsAuthError<TError = unknown> = ErrorType<
  "ImsAuthError",
  {
    message: string;
    error: TError;
  }
>;

/** Defines an authentication provider for Adobe IMS. */
export interface ImsAuthProvider {
  getAccessToken: () => Promise<string>;
  getHeaders: () => Promise<ImsAuthHeaders>;
}

/**
 * Converts IMS auth configuration properties to snake_case format.
 * @param config The IMS auth configuration with camelCase properties.
 * @returns The configuration with snake_case properties.
 */
function snakeCaseImsAuthConfig(
  config: ImsAuthParams,
): SnakeCasedProperties<ImsAuthParams> {
  return {
    scopes: config.scopes,
    env: config?.env ?? "prod",
    context: config.context,
    client_id: config.clientId,
    client_secrets: config.clientSecrets,
    technical_account_id: config.technicalAccountId,
    technical_account_email: config.technicalAccountEmail,
    ims_org_id: config.imsOrgId,
  };
}

/**
 * Asserts the provided configuration for an Adobe IMS authentication provider. {@link ImsAuthParams}
 * {@link ImsAuthProvider}
 * @param config {Record<PropertyKey, unknown>} The configuration to validate.
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
 *
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
  const result = safeParse(ImsAuthParamsSchema, config);
  if (!result.success) {
    throw new CommerceSdkValidationError(
      "Invalid ImsAuthProvider configuration",
      {
        issues: result.issues,
      },
    );
  }
}

/**
 * Creates an {@link ImsAuthProvider} based on the provided configuration.
 * @param config An {@link ImsAuthParams} parameter that contains the configuration for the IMS auth provider.
 * @returns An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.
 * @example
 * ```typescript
 * const config = {
 *   clientId: "your-client-id",
 *   clientSecrets: ["your-client-secret"],
 *   technicalAccountId: "your-technical-account-id",
 *   technicalAccountEmail: "your-account@example.com",
 *   imsOrgId: "your-ims-org-id@AdobeOrg",
 *   scopes: ["AdobeID", "openid"],
 *   environment: "prod",
 *   context: "my-app-context"
 * };
 *
 * const authProvider = getImsAuthProvider(config);
 *
 * // Get access token
 * const token = await authProvider.getAccessToken();
 * console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
 *
 * // Get headers for API requests
 * const headers = await authProvider.getHeaders();
 * console.log(headers);
 * // {
 * //   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
 * //   "x-api-key": "your-client-id"
 * // }
 *
 * // Use headers in API calls
 * const response = await fetch('https://api.adobe.io/some-endpoint', {
 *   headers: await authProvider.getHeaders()
 * });
 * ```
 */
export function getImsAuthProvider(config: ImsAuthParams) {
  const getAccessToken = async () => {
    const snakeCasedConfig = snakeCaseImsAuthConfig(config);

    await context.set(config.context, snakeCasedConfig);
    return getToken(config.context, {});
  };

  const getHeaders = async () => {
    const accessToken = await getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": config.clientId,
    };
  };

  return {
    getAccessToken,
    getHeaders,
  };
}
