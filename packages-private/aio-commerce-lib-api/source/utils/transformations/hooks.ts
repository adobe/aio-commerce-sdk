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

import camelcase from "camelcase";

import type { AfterResponseHook, KyResponse } from "ky";

/**
 * Builds a hook that transforms the keys of an object using the provided transformer function.
 * @param transformer - The function to transform the keys of the object.
 * @param recursive - Whether to transform the keys of the object recursively.
 */
export function buildObjectKeyTransformerResponseHook(
  transformer: (key: string) => string,
  recursive = true,
): AfterResponseHook {
  const transformObject = (obj: unknown): unknown => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return recursive ? obj.map(transformObject) : obj;
    }

    const transformedData = Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const transformedKey = transformer(key);
        const transformedValue = recursive ? transformObject(value) : value;
        return [transformedKey, transformedValue];
      }),
    );

    return transformedData;
  };

  return (_req, _opt, response: KyResponse) => {
    return response.json().then((data) => {
      const transformedData = transformObject(data);
      return Response.json(transformedData, response);
    });
  };
}

/** Builds a hook that transforms the keys of an object to camel case. */
export function buildCamelCaseKeysResponseHook(): AfterResponseHook {
  return buildObjectKeyTransformerResponseHook(camelcase);
}
