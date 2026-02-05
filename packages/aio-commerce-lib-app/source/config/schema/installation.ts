/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_NAME_LENGTH = 255;

/**
 * Regex for script paths that must start with a forward slash
 * and end with .js or .ts extension.
 * Examples: "/scripts/lib/setup.js", "/scripts/install.ts"
 */
const SCRIPT_PATH_REGEX = /^\/(?:[\w-]+\/)*[\w-]+\.(js|ts)$/;

/**
 * Schema for custom installation step configuration
 */
const CustomInstallationStepSchema = v.object({
  script: v.pipe(
    nonEmptyStringValueSchema("script path"),
    v.regex(
      SCRIPT_PATH_REGEX,
      'Script path must start with "/" and end with .js or .ts extension (e.g., "/scripts/setup.js")',
    ),
  ),

  name: v.pipe(
    nonEmptyStringValueSchema("step name"),
    v.maxLength(
      MAX_NAME_LENGTH,
      `The step name must not be longer than ${MAX_NAME_LENGTH} characters`,
    ),
  ),

  description: v.pipe(
    nonEmptyStringValueSchema("step description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The step description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),
});

/**
 * Schema for installation configuration
 */
export const InstallationSchema = v.object({
  customInstallationStep: v.optional(
    v.array(
      CustomInstallationStepSchema,
      "Expected an array of custom installation steps",
    ),
  ),
});

/** The installation configuration for an Adobe Commerce application */
export type InstallationConfiguration = v.InferInput<typeof InstallationSchema>;

/** Custom installation step configuration */
export type CustomInstallationStep = v.InferInput<
  typeof CustomInstallationStepSchema
>;
