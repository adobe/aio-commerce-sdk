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

import type { ErrorType, Result } from "@adobe/aio-commerce-lib-core/result";
import {
  type InferInput,
  nonEmpty,
  object,
  optional,
  parseJson,
  pipe,
  rawCheck,
  string,
  transform,
  array as vArray,
  message as vMessage,
} from "valibot";
import { nonEmptyString } from "~/lib/validation";

export const IMS_AUTH_ENV = {
  PROD: "prod",
  STAGE: "stage",
} as const;

export type ImsAuthEnv = (typeof IMS_AUTH_ENV)[keyof typeof IMS_AUTH_ENV];

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
            message ?? 'invalid JSON array, expected ["value1", "value2"]',
        });
      }
    }),
    parseJson(),
    vArray(string()),
  );
};
export const ImsAuthParamsSchema = vMessage(
  object({
    AIO_COMMERCE_IMS_CLIENT_ID: nonEmptyString(
      "Missing or invalid AIO_COMMERCE_IMS_CLIENT_ID",
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
      optional(string(), IMS_AUTH_ENV.PROD),
      transform((value) => {
        if (value === "stage") {
          return IMS_AUTH_ENV.STAGE;
        }

        return IMS_AUTH_ENV.PROD;
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
export type ImsAuthErrorType<TError = unknown> = ErrorType & {
  _tag: "ImsAuthError";
  message: string;
  error: TError;
};

export interface ImsAuthProvider {
  getAccessToken: () => Promise<Result<ImsAccessToken, ImsAuthErrorType>>;
  getHeaders: () => Promise<Result<ImsAuthHeaders, ImsAuthErrorType<unknown>>>;
}
