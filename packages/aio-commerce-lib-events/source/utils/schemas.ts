import * as v from "valibot";

const ALPHANUMERIC_OR_UNDERSCORE_REGEX = /^[a-zA-Z0-9_]+$/;
const ALPHANUMERIC_OR_UNDERSCORE_OR_HYPHEN_REGEX = /^[a-zA-Z0-9_-]+$/;

/** The schema of the workspace configuration in the Developer Console. */
export function workspaceConfigurationSchema(propertyName: string) {
  return v.union([
    v.string(`Expected a string value for property "${propertyName}"`),
    v.pipe(
      v.string(`Expected a string value for property "${propertyName}"`),
      v.parseJson(
        undefined,
        `Expected a valid JSON string for property "${propertyName}"`,
      ),
      // @TODO: Would be nice to have a schema for the actual contents of the workspace configuration.
      // This way we could catch potential issues with Commerce <-> I/O Provider sync because of an invalid configuration.
      v.looseObject({}),
    ),
  ]);
}

/** A schema for a string that only contains alphanumeric characters and underscores. */
export function alphaNumericOrUnderscoreSchema(name: string) {
  return v.pipe(
    v.string(`Expected a string value for property "${name}"`),
    v.regex(
      ALPHANUMERIC_OR_UNDERSCORE_REGEX,
      `Only alphanumeric characters and underscores are allowed for "${name}"`,
    ),
  );
}

/** A schema for a string that only contains alphanumeric characters, underscores, and hyphens. */
export function alphaNumericOrUnderscoreOrHyphenSchema(name: string) {
  return v.pipe(
    v.string(`Expected a string value for property "${name}"`),
    v.regex(
      ALPHANUMERIC_OR_UNDERSCORE_OR_HYPHEN_REGEX,
      `Only alphanumeric characters, underscores, and hyphens are allowed for property "${name}"`,
    ),
  );
}
