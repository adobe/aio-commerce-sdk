import * as v from "valibot";

import { stringValueSchema } from "~/utils/schemas";

/** The schema of the workspace configuration in the Developer Console. */
export function workspaceConfigurationSchema(propertyName: string) {
  return v.union([
    // Input Format (Empty String, JSON String or Object)
    v.pipe(stringValueSchema(propertyName), v.empty()),
    v.pipe(
      stringValueSchema(propertyName),
      v.parseJson(
        undefined,
        `Expected valid JSON string for property '${propertyName}'`,
      ),

      v.record(v.string(), v.unknown()),
      v.stringifyJson(),
    ),

    v.pipe(
      v.record(v.string(), v.unknown()),
      v.stringifyJson(
        undefined,
        `Expected valid JSON data for property '${propertyName}'`,
      ),
    ),
  ]);
}
