import * as v from "valibot";

import { stringValueSchema } from "~/utils/schemas";

/** The schema of the workspace configuration in the Developer Console. */
export function workspaceConfigurationSchema(propertyName: string) {
  return v.pipe(
    // Input Format (JSON String or Object)
    v.union([
      v.pipe(
        stringValueSchema(propertyName),
        v.parseJson(
          undefined,
          `Expected valid JSON string for property '${propertyName}'`,
        ),

        // @TODO: Would be nice to have a schema for the actual contents of the workspace configuration.
        // This way we could catch potential issues with Commerce <-> I/O Provider sync because of an invalid configuration.
        v.record(v.string(), v.unknown()),
        v.stringifyJson(),
      ),

      v.record(v.string(), v.unknown()),
    ]),
    // Output Format (JSON String)
    v.stringifyJson(
      undefined,
      `Expected valid JSON data for property '${propertyName}'`,
    ),
  );
}
