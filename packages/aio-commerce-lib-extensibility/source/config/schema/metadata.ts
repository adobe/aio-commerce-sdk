import * as v from "valibot";

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
    nonEmptyString("application id"),
    v.regex(
      /^[a-zA-Z0-9-]+$/,
      "The application id must contain only alphanumeric characters and dashes",
    ),
  ),

  displayName: v.pipe(
    nonEmptyString("application display name"),
    v.maxLength(
      MAX_DISPLAY_NAME_LENGTH,
      "The application display name must not be longer than 255 characters",
    ),
  ),

  description: v.pipe(
    nonEmptyString("metadata description"),
    v.maxLength(
      MAX_DESCRIPTION_LENGTH,
      "The metadata description must not be longer than 255 characters",
    ),
  ),

  version: v.pipe(
    nonEmptyString("version"),
    v.regex(
      SEMVER_REGEX,
      "The version must follow semantic versioning (semver) format",
    ),
  ),
});

/** The metadata associated to an Adobe Commerce application. */
export type ApplicationMetadata = v.InferInput<typeof MetadataSchema>;
