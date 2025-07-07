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
  entriesFromList,
  type InferInput,
  instance,
  nonEmpty,
  nonOptional,
  object,
  picklist,
  pipe,
  safeParser,
  string,
  union,
  message as vMessage,
  url as vUrl,
} from "valibot";
import type { Failure, Success } from "~/lib/result";
import type { ValidationErrorType } from "~/lib/validation";

/**
 * The HTTP methods supported by Commerce.
 * This is used to determine which headers to include in the signing of the authorization header.
 */
const AllowedHttpMethod = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const HttpMethodSchema = picklist(AllowedHttpMethod);
export type HttpMethodInput = InferInput<typeof HttpMethodSchema>;
const BaseUrlSchema = pipe(
  string(),
  nonEmpty("Missing commerce endpoint"),
  vUrl("The url is badly formatted."),
);
export const UrlSchema = union([BaseUrlSchema, instance(URL)]);
export type UriInput = InferInput<typeof UrlSchema>;
const IntegrationAuthParamKeys = [
  "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
  "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
  "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
  "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
];
export const IntegrationAuthParamsSchema = nonOptional(
  vMessage(
    object(
      entriesFromList(
        IntegrationAuthParamKeys,
        pipe(string(), nonEmpty("Missing commerce integration parameter")),
      ),
    ),
    (issue) => {
      return `Missing or invalid commerce integration parameter ${issue.expected}`;
    },
  ),
);
export const integrationAuthParamsParser = safeParser(
  IntegrationAuthParamsSchema,
);
export type IntegrationAuthParamsInput = InferInput<
  typeof IntegrationAuthParamsSchema
>;
export type IntegrationAuthHeader = "Authorization";
export type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

export interface IntegrationConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface IntegrationAuthProvider {
  getHeaders: (
    method: HttpMethodInput,
    url: UriInput,
  ) => Success<IntegrationAuthHeaders> | Failure<ValidationErrorType<unknown>>;
}
