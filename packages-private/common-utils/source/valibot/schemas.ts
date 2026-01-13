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

import * as v from "valibot";

const ALPHANUMERIC_OR_UNDERSCORE_REGEX = /^[a-zA-Z0-9_]+$/;
const ALPHANUMERIC_OR_UNDERSCORE_OR_HYPHEN_REGEX = /^[a-zA-Z0-9_-]+$/;

/** A schema for a string value. */
export function stringValueSchema(propertyName: string) {
  return v.string(`Expected a string value for property '${propertyName}'`);
}

/** A schema for a boolean value. */
export function booleanValueSchema(propertyName: string) {
  return v.boolean(`Expected a boolean value for property '${propertyName}'`);
}

/** A schema for a string that only contains alphanumeric characters and underscores. */
export function alphaNumericOrUnderscoreSchema(name: string) {
  return v.pipe(
    stringValueSchema(name),
    v.regex(
      ALPHANUMERIC_OR_UNDERSCORE_REGEX,
      `Only alphanumeric characters and underscores are allowed for "${name}"`,
    ),
  );
}

/** A schema for a string that only contains alphanumeric characters, underscores, and hyphens. */
export function alphaNumericOrUnderscoreOrHyphenSchema(name: string) {
  return v.pipe(
    stringValueSchema(name),
    v.regex(
      ALPHANUMERIC_OR_UNDERSCORE_OR_HYPHEN_REGEX,
      `Only alphanumeric characters, underscores, and hyphens are allowed for property "${name}"`,
    ),
  );
}
