import {
  type ErrorType,
  err,
  map,
  ok,
  type Result,
} from "@adobe/aio-commerce-lib-core/result";

import type { ValidationErrorType } from "@adobe/aio-commerce-lib-core/validation";
import { context, getToken } from "@adobe/aio-lib-ims";

import { snakeCase } from "es-toolkit";
import { type InferInput, type InferIssue, safeParse } from "valibot";

import {
  type ImsAuthEnv,
  type ImsAuthParams,
  ImsAuthParamsSchema,
} from "./schema";

type ImsAccessToken = string;
type ImsAuthHeader = "Authorization" | "x-api-key";
type ImsAuthHeaders = Record<ImsAuthHeader, string>;

/** Defines a validation error type for the IMS auth service. */
export type ImsAuthValidationError = ValidationErrorType<
  "ImsAuthValidationError",
  InferIssue<typeof ImsAuthParamsSchema>[]
>;

/** Defines an error type for the IMS auth service. */
export type ImsAuthError<TError = unknown> = ErrorType<
  "ImsAuthError",
  {
    message: string;
    error: TError;
  }
>;

/** Defines the configuration options to create an {@link ImsAuthProvider}. */
export interface ImsAuthConfig {
  clientId: string;
  clientSecrets: string[];
  technicalAccountId: string;
  technicalAccountEmail: string;
  imsOrgId: string;
  scopes: string[];
  environment: ImsAuthEnv;
  context: string;
}

/** Defines an authentication provider for Adobe IMS. */
export interface ImsAuthProvider {
  getAccessToken: () => Promise<Result<ImsAccessToken, ImsAuthError>>;
  getHeaders: () => Promise<Result<ImsAuthHeaders, ImsAuthError>>;
}

function makeImsAuthValidationError(
  message: string,
  issues: InferIssue<typeof ImsAuthParamsSchema>[],
) {
  return {
    _tag: "ImsAuthValidationError",
    message,
    issues,
  } satisfies ImsAuthValidationError;
}

function makeImsAuthError(message: string, error: unknown) {
  return {
    _tag: "ImsAuthError",
    message,
    error,
  } satisfies ImsAuthError;
}

function fromParams(params: ImsAuthParams) {
  return {
    clientId: params.AIO_COMMERCE_IMS_CLIENT_ID,
    clientSecrets: params.AIO_COMMERCE_IMS_CLIENT_SECRETS,
    technicalAccountId: params.AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID,
    technicalAccountEmail: params.AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL,
    imsOrgId: params.AIO_COMMERCE_IMS_IMS_ORG_ID,
    scopes: params.AIO_COMMERCE_IMS_SCOPES,
    environment: params.AIO_COMMERCE_IMS_ENV,
    context: params.AIO_COMMERCE_IMS_CTX,
  } satisfies ImsAuthConfig;
}

async function tryGetAccessToken(
  contextName: string,
): Promise<Result<ImsAccessToken, ImsAuthError>> {
  try {
    const accessToken = await getToken(contextName, {});
    return ok(accessToken);
  } catch (error) {
    return err(makeImsAuthError("Failed to retrieve IMS access token", error));
  }
}

/**
 * Creates an {@link ImsAuthProvider} based on the provided configuration.
 * @param config The configuration for the IMS Auth Provider.
 * @returns An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.
 */
export function getImsAuthProvider(config: ImsAuthConfig): ImsAuthProvider {
  const getAccessToken = async () => {
    const snakeCasedConfig = Object.fromEntries(
      Object.entries(config).map(([key, value]) => [snakeCase(key), value]),
    );

    await context.set(config.context, snakeCasedConfig);
    return tryGetAccessToken(config.context);
  };

  const getHeaders = async () => {
    const result = await getAccessToken();
    return map(result, (accessToken) => ({
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": config.clientId,
    }));
  };

  return {
    getAccessToken,
    getHeaders,
  };
}

/**
 * Tries to create an {@link ImsAuthProvider} based on the provided parameters.
 * @param params The parameters required to create the IMS Auth Provider.
 * @returns An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.
 */
export function tryGetImsAuthProvider(
  params: InferInput<typeof ImsAuthParamsSchema>,
): Result<ImsAuthProvider, ImsAuthValidationError> {
  const validation = safeParse(ImsAuthParamsSchema, params);

  if (!validation.success) {
    return err(
      makeImsAuthValidationError(
        "Failed to validate the provided IMS parameters",
        validation.issues,
      ),
    );
  }

  return ok(getImsAuthProvider(fromParams(validation.output)));
}
