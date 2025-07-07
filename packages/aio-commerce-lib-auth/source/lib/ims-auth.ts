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

import { context, getToken } from "@adobe/aio-lib-ims";
import { type InferOutput, safeParse } from "valibot";
import {
  type ImsAuthConfig,
  type ImsAuthParamsInput,
  ImsAuthParamsSchema,
} from "~/lib/ims-auth/ims-auth-types";
import { fail, type Result, succeed } from "~/lib/result";
import type { ValidationErrorType } from "~/lib/validation";

export type ImsAccessToken = string;

export type ImsAuthHeader = "Authorization" | "x-api-key";
export type ImsAuthHeaders = Record<ImsAuthHeader, string>;

export interface ImsAuthProvider {
  getHeaders: () => Promise<ImsAuthHeaders>;
  getAccessToken: () => Promise<ImsAccessToken>;
}

export type ImsAuthProviderResult = Result<
  ImsAuthProvider,
  ValidationErrorType<unknown>
>;

/**
 * If the required IMS parameters are present, this function returns an ImsAuthProvider.
 * @param {ImsAuthConfig} config includes IMS parameters
 * @returns {Promise} returns the ImsAuthProviderResult type
 */
export async function getImsAuthProviderWithConfig(
  config: ImsAuthConfig,
): Promise<ImsAuthProviderResult> {
  await context.set(config.context, config);
  return succeed({
    getAccessToken: async () => getToken(config.context, {}),
    getHeaders: async () => {
      const accessToken = await getToken(config.context, {});
      return {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": config.client_id,
      };
    },
  });
}

/**
 * If the required IMS parameters are present, this function returns an ImsAuthProvider.
 * @param {ImsAuthParamsInput} params includes IMS parameters
 * @returns {Promise} returns the ImsAuthProviderResult type
 */
export async function getImsAuthProviderWithParams(
  params: ImsAuthParamsInput,
): Promise<ImsAuthProviderResult> {
  const validation = safeParse(ImsAuthParamsSchema, params);

  if (!validation.success) {
    return fail({
      _tag: "ValidationError",
      message:
        "Failed to validate the provided IMS parameters. See the console for more details.",
      issues: validation.issues,
    });
  }

  return await getImsAuthProviderWithConfig(
    resolveImsConfig(validation.output),
  );
}

function resolveImsConfig(
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
