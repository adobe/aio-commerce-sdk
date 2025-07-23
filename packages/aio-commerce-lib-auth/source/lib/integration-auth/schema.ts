/**
 * @license
 *
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
  instance,
  nonEmpty,
  nonOptional,
  object,
  pipe,
  string,
  transform,
  union,
  url as vUrl,
} from "valibot";

import type { InferOutput } from "valibot";

/**
 * The HTTP methods supported by Commerce.
 * This is used to determine which headers to include in the signing of the authorization header.
 */
export type HttpMethodInput = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Creates a validation schema for a required Commerce Integration string parameter.
 * @param name The name of the parameter for error messages.
 * @returns A validation pipeline that ensures the parameter is a non-empty string.
 */
const integrationAuthParameter = (name: string) =>
  pipe(
    string(
      `Expected a string value for the Commerce Integration parameter ${name}`,
    ),
    nonEmpty(
      `Expected a non-empty string value for the Commerce Integration parameter ${name}`,
    ),
  );

/** Validation schema for the Adobe Commerce endpoint base URL. */
const BaseUrlSchema = pipe(
  string("Expected a string for the Adobe Commerce endpoint"),
  nonEmpty("Expected a non-empty string for the Adobe Commerce endpoint"),
  vUrl("Expected a valid url for the Adobe Commerce endpoint"),
);

/** Validation schema that accepts either a URL string or URL instance and normalizes to string. */
export const UrlSchema = pipe(
  union([BaseUrlSchema, instance(URL)]),
  transform((url) => {
    if (url instanceof URL) {
      return url.toString();
    }
    return url;
  }),
);
/**
 * The schema for the Commerce Integration parameters.
 * This is used to validate the parameters passed to the Commerce Integration provider.
 */
export const IntegrationAuthParamsSchema = nonOptional(
  object({
    consumerKey: integrationAuthParameter("consumerKey"),
    consumerSecret: integrationAuthParameter("consumerSecret"),
    accessToken: integrationAuthParameter("accessToken"),
    accessTokenSecret: integrationAuthParameter("accessTokenSecret"),
  }),
);

/** Defines the parameters required for Commerce Integration authentication. */
export type IntegrationAuthParams = InferOutput<
  typeof IntegrationAuthParamsSchema
>;
