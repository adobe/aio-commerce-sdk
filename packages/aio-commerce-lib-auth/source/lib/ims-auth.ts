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

import {
  type Failure,
  fail,
  getData,
  isFailure,
  type Result,
  type Success,
  succeed,
} from "@adobe/aio-commerce-lib-core/result";
import type { ValidationErrorType } from "@adobe/aio-commerce-lib-core/validation";
import { context, getToken } from "@adobe/aio-lib-ims";
import { type InferOutput, safeParse } from "valibot";
import {
  type ImsAccessToken,
  type ImsAuthConfig,
  type ImsAuthErrorType,
  type ImsAuthHeaders,
  type ImsAuthParamsInput,
  ImsAuthParamsSchema,
  type ImsAuthProvider,
} from "~/lib/ims-auth-types";

async function tryGetAccessToken(
  contextName: string,
): Promise<Result<ImsAccessToken, ImsAuthErrorType<unknown>>> {
  try {
    const accessToken = await getToken(contextName, {});
    return succeed(accessToken) satisfies Success<ImsAccessToken>;
  } catch (error) {
    return fail({
      _tag: "ImsAuthError",
      message: "Failed to retrieve IMS access token.",
      error,
    }) satisfies Failure<ImsAuthErrorType<unknown>>;
  }
}

/**
 * Creates an IMS Auth Provider based on the provided configuration.
 * @param config {ImsAuthConfig} - The configuration for the IMS Auth Provider.
 * @returns {ImsAuthProvider} - An object with methods to get access token and headers.
 */
export function getImsAuthProvider(config: ImsAuthConfig) {
  const getAccessToken = async () => {
    const token = await tryGetAccessToken(config.context);
    await context.set(config.context, config);
    return token;
  };

  const getHeaders = async () => {
    const result = await getAccessToken();

    if (isFailure(result)) {
      return result;
    }

    const accessToken = getData(result);
    return succeed({
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": config.client_id,
    }) satisfies Success<ImsAuthHeaders>;
  };

  return {
    getAccessToken,
    getHeaders,
  };
}

/**
 * Tries to get an IMS Auth Provider based on the provided parameters.
 * @param params {ImsAuthParamsInput} - The parameters required to create the IMS Auth Provider.
 * @returns {Result} containing either the ImsAuthProvider or a Failure with validation errors.
 */
export function tryGetImsAuthProvider(params: ImsAuthParamsInput) {
  const validation = safeParse(ImsAuthParamsSchema, params);

  if (!validation.success) {
    return fail({
      _tag: "ValidationError",
      issues: validation.issues,
      message:
        "Failed to validate the provided IMS parameters. See the console for more details.",
    }) satisfies Failure<ValidationErrorType>;
  }

  return succeed(
    getImsAuthProvider(fromParams(validation.output)),
  ) satisfies Success<ImsAuthProvider>;
}

function fromParams(
  params: InferOutput<typeof ImsAuthParamsSchema>,
): ImsAuthConfig {
  return {
    client_id: params.AIO_COMMERCE_IMS_CLIENT_ID,
    client_secrets: params.AIO_COMMERCE_IMS_CLIENT_SECRETS,
    technical_account_id: params.AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID,
    technical_account_email: params.AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL,
    ims_org_id: params.AIO_COMMERCE_IMS_IMS_ORG_ID,
    scopes: params.AIO_COMMERCE_IMS_SCOPES,
    environment: params.AIO_COMMERCE_IMS_ENV,
    context: params.AIO_COMMERCE_IMS_CTX,
  };
}
