import * as v from "valibot";

/** A schema for a string value. */
export function stringValueSchema(propertyName: string) {
  return v.string(`Expected a string value for property '${propertyName}'`);
}
