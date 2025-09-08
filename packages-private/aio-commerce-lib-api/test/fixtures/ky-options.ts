import {
  buildCamelCaseKeysResponseHook,
  buildObjectKeyTransformerResponseHook,
} from "#utils/transformations/hooks";

/**
 * Builds a fetch options object with a hook that transforms the keys of an object to uppercase.
 * @param recursive - Whether to transform the keys of the object recursively.
 */
export function buildUppercaseKeysHookFetchOptions(recursive = true) {
  const hook = buildObjectKeyTransformerResponseHook(
    (key) => key.toUpperCase(),
    recursive,
  );
  return {
    hooks: {
      afterResponse: [hook],
    },
  };
}

/** Builds a fetch options object with a hook that transforms the keys of an object to camel case. */
export function buildCamelCaseKeysHookFetchOptions() {
  const hook = buildCamelCaseKeysResponseHook();
  return {
    hooks: {
      afterResponse: [hook],
    },
  };
}
