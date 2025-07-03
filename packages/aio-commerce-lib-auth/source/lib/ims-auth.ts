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
import {
  type InferInput,
  type InferOutput,
  nonEmpty,
  nonOptional,
  object,
  optional,
  parseJson,
  pipe,
  rawCheck,
  safeParse,
  string,
  transform,
  array as vArray,
  message as vMessage,
} from "valibot";
import { Result } from "~/lib/result";
import type { ValidationErrorType } from "./utils";

const ImsAuthEnv = {
  PROD: "prod",
  STAGE: "stage",
} as const;

type ImsAuthEnv = (typeof ImsAuthEnv)[keyof typeof ImsAuthEnv];

export interface ImsAuthConfig {
  client_id: string;
  client_secrets: string[];
  technical_account_id: string;
  technical_account_email: string;
  ims_org_id: string;
  scopes: string[];
  environment: ImsAuthEnv;
  context: string;
}

const nonEmptyString = (message: string) => pipe(string(), nonEmpty(message));

const createStringArraySchema = (message?: string) => {
  return pipe(
    string(),
    nonEmpty("Missing or invalid"),
    rawCheck(({ dataset, addIssue }) => {
      if (
        !dataset.value ||
        typeof dataset.value !== "string" ||
        (dataset.value as string).trim() === ""
      ) {
        return;
      }
      try {
        JSON.parse(dataset.value as string);
      } catch (_e) {
        addIssue({
          message:
            message ?? `invalid JSON array, expected ["value1", "value2"]`,
        });
      }
    }),
    parseJson(),
    vArray(string()),
  );
};

export const ImsAuthParamsSchema = vMessage(
  object({
    AIO_COMMERCE_IMS_CLIENT_ID: nonOptional(
      nonEmptyString("Missing or invalid AIO_COMMERCE_IMS_CLIENT_ID"),
    ),
    AIO_COMMERCE_IMS_CLIENT_SECRETS: createStringArraySchema(),
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: nonEmptyString(
      "Missing or invalid AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID",
    ),
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: nonEmptyString(
      "Missing or invalid AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL",
    ),
    AIO_COMMERCE_IMS_IMS_ORG_ID: nonEmptyString(
      "Missing or invalid AIO_COMMERCE_IMS_IMS_ORG_ID",
    ),
    AIO_COMMERCE_IMS_ENV: pipe(
      optional(string(), ImsAuthEnv.PROD),
      transform((value) => {
        if (value === "stage") {
          return ImsAuthEnv.STAGE;
        }

        return ImsAuthEnv.PROD; // Default to PROD if not specified
      }),
    ),
    AIO_COMMERCE_IMS_SCOPES: createStringArraySchema(),
    AIO_COMMERCE_IMS_CTX: pipe(optional(string(), "aio-commerce-sdk-creds")),
  }),
  (issue) => {
    return `Missing or invalid ims auth parameter ${issue.expected}`;
  },
);

export type ImsAuthParamsInput = InferInput<typeof ImsAuthParamsSchema>;

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
 * @returns {ImsAuthProvider} returns the IMS auth provider
 */
export async function getImsAuthProviderWithConfig(config: ImsAuthConfig) {
  await context.set(config.context, config);
  return Result.success({
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
 * @returns {ImsAuthProvider} returns the IMS auth provider
 */
export async function getImsAuthProviderWithParams(
  params: ImsAuthParamsInput,
): Promise<ImsAuthProviderResult> {
  const validation = safeParse(ImsAuthParamsSchema, params);

  if (!validation.success) {
    return Result.fail({
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
