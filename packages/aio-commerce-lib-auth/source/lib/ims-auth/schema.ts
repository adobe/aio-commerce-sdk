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
  type InferOutput,
  nonEmpty,
  object,
  optional,
  parseJson,
  pipe,
  string,
  array as vArray,
  enum as vEnum,
  message as vMessage,
} from "valibot";

const imsAuthParameter = (name: string) =>
  pipe(
    string(`Expected a string value for the IMS auth parameter ${name}`),
    nonEmpty(
      `Expected a non-empty string value for the IMS auth parameter ${name}`,
    ),
  );

const jsonStringArray = (name: string) => {
  const jsonStringArraySchema = vMessage(
    pipe(
      string(`Expected a string value for the IMS auth parameter ${name}`),
      nonEmpty(
        `Expected a non-empty string value for the IMS auth parameter ${name}`,
      ),
      parseJson(),
    ),
    `An error ocurred while parsing the JSON string array parameter ${name}`,
  );

  return pipe(
    jsonStringArraySchema,
    vArray(
      string(),
      `Expected a stringified JSON array value for the IMS auth parameter ${name}`,
    ),
  );
};

/** The environments accepted by the IMS auth service. */
export const IMS_AUTH_ENV = {
  PROD: "prod",
  STAGE: "stage",
} as const;

const ImsAuthEnvSchema = vEnum(IMS_AUTH_ENV);

/** Defines the schema to validate the necessary parameters for the IMS auth service. */
export const ImsAuthParamsSchema = object({
  AIO_COMMERCE_IMS_CLIENT_ID: imsAuthParameter("AIO_COMMERCE_IMS_CLIENT_ID"),
  AIO_COMMERCE_IMS_CLIENT_SECRETS: jsonStringArray(
    "AIO_COMMERCE_IMS_CLIENT_SECRETS",
  ),
  AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: imsAuthParameter(
    "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID",
  ),

  AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: imsAuthParameter(
    "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL",
  ),
  AIO_COMMERCE_IMS_IMS_ORG_ID: imsAuthParameter("AIO_COMMERCE_IMS_IMS_ORG_ID"),

  AIO_COMMERCE_IMS_ENV: pipe(optional(ImsAuthEnvSchema, IMS_AUTH_ENV.PROD)),
  AIO_COMMERCE_IMS_CTX: pipe(optional(string(), "aio-commerce-sdk-creds")),
  AIO_COMMERCE_IMS_SCOPES: jsonStringArray("AIO_COMMERCE_IMS_SCOPES"),
});

/** Defines the parameters for the IMS auth service. */
export type ImsAuthParams = InferOutput<typeof ImsAuthParamsSchema>;

/** Defines the environments accepted by the IMS auth service. */
export type ImsAuthEnv = InferOutput<typeof ImsAuthEnvSchema>;
