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
  email,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  string,
  array as vArray,
} from "valibot";

import type { InferOutput } from "valibot";

/**
 * Creates a validation schema for a required IMS auth string parameter.
 * @param name The name of the parameter for error messages.
 * @returns A validation pipeline that ensures the parameter is a non-empty string.
 */
const imsAuthParameter = (name: string) =>
  pipe(
    string(`Expected a string value for the IMS auth parameter ${name}`),
    nonEmpty(
      `Expected a non-empty string value for the IMS auth parameter ${name}`,
    ),
  );

/**
 * Creates a validation schema for an IMS auth string array parameter.
 * @param name The name of the parameter for error messages.
 * @returns A validation pipeline that ensures the parameter is an array of strings.
 */
const stringArray = (name: string) =>
  pipe(
    vArray(
      string(),
      `Expected a string array value for the IMS auth parameter ${name}`,
    ),
  );

/** Validation schema for IMS auth environment values. */
const ImsAuthEnvSchema = picklist(["prod", "stage"]);

/** Defines the schema to validate the necessary parameters for the IMS auth service. */
export const ImsAuthParamsSchema = object({
  clientId: imsAuthParameter("clientId"),
  clientSecrets: pipe(
    stringArray("clientSecrets"),
    minLength(1, "Expected at least one client secret for IMS auth"),
  ),
  technicalAccountId: imsAuthParameter("technicalAccountId"),
  technicalAccountEmail: pipe(
    string(
      "Expected a string value for the IMS auth parameter technicalAccountEmail",
    ),
    email("Expected a valid email format for technicalAccountEmail"),
  ),
  imsOrgId: imsAuthParameter("imsOrgId"),
  environment: pipe(optional(ImsAuthEnvSchema)),
  context: pipe(optional(string())),
  scopes: pipe(
    stringArray("scopes"),
    minLength(1, "Expected at least one scope for IMS auth"),
  ),
});

/** Defines the parameters for the IMS auth service. */
export type ImsAuthParams = InferOutput<typeof ImsAuthParamsSchema>;

/** Defines the environments accepted by the IMS auth service. */
export type ImsAuthEnv = InferOutput<typeof ImsAuthEnvSchema>;
