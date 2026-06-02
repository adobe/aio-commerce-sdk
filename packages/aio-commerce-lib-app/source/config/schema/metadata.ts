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

import { alphaNumericOrHyphenSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { AnyCommerceAppConfig } from "./app";

const MAX_ID_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 255;
const MAX_DISPLAY_NAME_LENGTH = 50;

// Simple semantic versioning: Major.Minor.Patch (e.g., 1.2.3)
// Only numeric versions allowed - no prerelease or build identifiers
// For a more advanced versioning schema, see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const NUMERIC_IDENTIFIER = "(0|[1-9]\\d*)";
const SEMVER_REGEX = new RegExp(
  `^${NUMERIC_IDENTIFIER}\\.${NUMERIC_IDENTIFIER}\\.${NUMERIC_IDENTIFIER}$`,
);

function nonEmptyString(fieldName: string) {
  return v.pipe(
    v.string(`Expected a string for the ${fieldName}`),
    v.nonEmpty(`The ${fieldName} must not be empty`),
  );
}

/** The schema for the metadata of the application. */
export const MetadataSchema = v.object({
  id: v.pipe(
    alphaNumericOrHyphenSchema("application id (metadata.id)"),
    v.maxLength(
      MAX_ID_LENGTH,
      `The application id must not be longer than ${MAX_ID_LENGTH} characters`,
    ),
  ),
  displayName: v.pipe(
    nonEmptyString("application display name"),
    v.maxLength(
      MAX_DISPLAY_NAME_LENGTH,
      `The application display name must not be longer than ${MAX_DISPLAY_NAME_LENGTH} characters`,
    ),
  ),

  description: v.pipe(
    nonEmptyString("metadata description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      `The metadata description must not be longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
  ),

  version: v.pipe(
    nonEmptyString("version"),
    v.regex(
      SEMVER_REGEX,
      "The version must follow semantic versioning (semver) format: Major.Minor.Patch (e.g., '1.0.0', '2.3.1')",
    ),
  ),
});

/** The metadata associated to an Adobe Commerce application. */
export type ApplicationMetadata = v.InferInput<typeof MetadataSchema>;

/** Config type when metadata is present. */
export type AppConfigWithMetadata<T extends AnyCommerceAppConfig> = T & {
  metadata: NonNullable<T["metadata"]>;
};

/**
 * Check if config has metadata.
 * @param config - The configuration to check.
 */
export function hasMetadata<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & AppConfigWithMetadata<T> {
  // This will likely never be false, but we'll keep the check for completeness
  return config.metadata !== undefined;
}
