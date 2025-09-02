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
