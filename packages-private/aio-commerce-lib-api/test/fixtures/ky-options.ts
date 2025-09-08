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
