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
  type InferInput,
  instance,
  nonEmpty,
  nonOptional,
  object,
  picklist,
  pipe,
  string,
  transform,
  union,
  url as vUrl,
} from "valibot";

/**
 * The HTTP methods supported by Commerce.
 * This is used to determine which headers to include in the signing of the authorization header.
 */
const AllowedHttpMethod = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export const HttpMethodSchema = picklist(AllowedHttpMethod);
export type HttpMethodInput = InferInput<typeof HttpMethodSchema>;

const integrationAuthParameter = (name: string) =>
  pipe(
    string(
      `Expected a string value for the Commerce Integration parameter ${name}`,
    ),
    nonEmpty(
      `Expected a non-empty string value for the Commerce Integration parameter ${name}`,
    ),
  );

const BaseUrlSchema = pipe(
  string("Expected a string for the Adobe Commerce endpoint"),
  nonEmpty("Expected a non-empty string for the Adobe Commerce endpoint"),
  vUrl("Expected a valid url for the Adobe Commerce endpoint"),
);

export const UrlSchema = pipe(
  union([BaseUrlSchema, instance(URL)]),
  transform((url) => {
    if (url instanceof URL) {
      return url.toString();
    }
    return url;
  }),
);

export type AdobeCommerceUri = InferInput<typeof UrlSchema>;

/**
 * The schema for the Commerce Integration parameters.
 * This is used to validate the parameters passed to the Commerce Integration provider.
 */
export const IntegrationAuthParamsSchema = nonOptional(
  object({
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: integrationAuthParameter(
      "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY",
    ),
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: integrationAuthParameter(
      "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET",
    ),
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: integrationAuthParameter(
      "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN",
    ),
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: integrationAuthParameter(
      "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET",
    ),
  }),
);

export type IntegrationAuthParams = InferInput<
  typeof IntegrationAuthParamsSchema
>;
