import util from "node:util";

/**
 * Shorthand to inspect an object.
 *
 * @param obj - The object to inspect.
 * @returns A string representation of the object.
 */
export function inspect(
  obj: unknown,
  params: util.InspectOptions = {},
): string {
  return util.inspect(obj, {
    depth: null,
    ...params,
  });
}
