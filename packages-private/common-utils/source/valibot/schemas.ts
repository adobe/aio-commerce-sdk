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

type Casing = "lowercase" | "uppercase" | "any";

const ALPHANUMERIC_OR_UNDERSCORE_REGEX = {
  any: /^[a-zA-Z0-9_]+$/,
  lowercase: /^[a-z0-9_]+$/,
  uppercase: /^[A-Z0-9_]+$/,
};

const ALPHANUMERIC_OR_UNDERSCORE_OR_HYPHEN_REGEX = {
  any: /^[a-zA-Z0-9_-]+$/,
  lowercase: /^[a-z0-9_-]+$/,
  uppercase: /^[A-Z0-9_-]+$/,
};

const ALPHANUMERIC_OR_HYPHEN_REGEX = {
  any: /^[a-zA-Z0-9-]+$/,
  lowercase: /^[a-z0-9-]+$/,
  uppercase: /^[A-Z0-9-]+$/,
};

/**
 * A schema for a string value.
 * @param name The name of the field this schema refers to.
 */
export function stringValueSchema(name: string) {
  return v.string(`Expected a string value for '${name}'`);
}

/**
 * A schema for a non-empty string value.
 * @param name The name of the field this schema refers to.
 */
export function nonEmptyStringValueSchema(name: string) {
  return v.pipe(
    stringValueSchema(name),
    v.nonEmpty(`The value of "${name}" must not be empty`),
  );
}

/**
 * A schema for a boolean value.
 * @param name The name of the field this schema refers to.
 */
export function booleanValueSchema(name: string) {
  return v.boolean(`Expected a boolean value for '${name}'`);
}

/**
 * A schema for a string that only contains alphanumeric characters and underscores.
 * @param name The name of the field this schema refers to.
 * @param casing The allowed casing for the string (default: "any").
 */
export function alphaNumericOrUnderscoreSchema(
  name: string,
  casing: Casing = "any",
) {
  const casingLabel = casing === "any" ? "" : ` (${casing} only)`;
  return v.pipe(
    stringValueSchema(name),
    v.regex(
      ALPHANUMERIC_OR_UNDERSCORE_REGEX[casing],
      `Only alphanumeric characters and underscores are allowed in string value of "${name}"${casingLabel}`,
    ),
  );
}

/**
 * A schema for a string that only contains alphanumeric characters, underscores, and hyphens.
 * @param name The name of the field this schema refers to.
 * @param casing The allowed casing for the string (default: "any").
 */
export function alphaNumericOrUnderscoreOrHyphenSchema(
  name: string,
  casing: Casing = "any",
) {
  const casingLabel = casing === "any" ? "" : ` (${casing} only)`;
  return v.pipe(
    stringValueSchema(name),
    v.regex(
      ALPHANUMERIC_OR_UNDERSCORE_OR_HYPHEN_REGEX[casing],
      `Only alphanumeric characters, underscores, and hyphens are allowed in string value of "${name}"${casingLabel}`,
    ),
  );
}

/**
 * A schema for a string that only contains alphanumeric characters and hyphens.
 * @param name The name of the field this schema refers to.
 * @param casing The allowed casing for the string (default: "any").
 */
export function alphaNumericOrHyphenSchema(
  name: string,
  casing: Casing = "any",
) {
  const casingLabel = casing === "any" ? "" : ` (${casing} only)`;
  return v.pipe(
    stringValueSchema(name),
    v.regex(
      ALPHANUMERIC_OR_HYPHEN_REGEX[casing],
      `Only alphanumeric characters and hyphens are allowed in string value of "${name}"${casingLabel}`,
    ),
  );
}
