/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Validates input against a Standard Schema and returns a result.
 *
 * @template TInput - The input type expected by the schema
 * @template TOutput - The output type produced by the schema
 * @param schema - A Standard Schema v1 compliant schema
 * @param input - The input data to validate
 * @returns A promise resolving to either success with validated data or failure with issues
 *
 * @example
 * ```typescript
 * const result = await validateSchema(mySchema, userInput);
 * if (result.success) {
 *   console.log(result.data); // Typed as TOutput
 * } else {
 *   console.error(result.issues); // Validation errors
 * }
 * ```
 */
export async function validateSchema<TInput, TOutput>(
  schema: StandardSchemaV1<TInput, TOutput>,
  input: unknown,
) {
  const result = await schema["~standard"].validate(input);

  if (result.issues) {
    // Normalize issues to ensure consistent path format
    const issues: StandardSchemaV1.Issue[] = result.issues.map((issue) => ({
      message: issue.message,
      path: issue.path?.map((segment) =>
        typeof segment === "object" && segment !== null && "key" in segment
          ? (segment.key as string | number)
          : (segment as string | number),
      ),
    }));

    return { success: false, issues } as const;
  }

  return { success: true, data: result.value } as const;
}

/**
 * Parses a base64-encoded request body from OpenWhisk/Runtime.
 * @param encodedBody - Base64-encoded body string from __ow_body
 *
 * @example
 * ```typescript
 * const body = parseRequestBody(params.__ow_body);
 * ```
 */
export function parseRequestBody(encodedBody?: string): unknown {
  if (!encodedBody) {
    return {};
  }

  try {
    const decoded = Buffer.from(encodedBody, "base64").toString();
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

/**
 * Parses query parameters from OpenWhisk/Runtime format.
 *
 * @param queryString - Query string from __ow_query
 * @param fallbackParams - Fallback params object (used when __ow_query is not present)
 * @returns Parsed query parameters as a record
 *
 * @example
 * ```typescript
 * const query = parseQueryParams(params.__ow_query, params);
 * ```
 */
export function parseQueryParams(
  queryString?: string,
  fallbackParams?: Record<string, unknown>,
): Record<string, string> {
  if (queryString) {
    return Object.fromEntries(new URLSearchParams(queryString));
  }

  // When __ow_query is not present, extract from params (excluding OpenWhisk fields)
  if (fallbackParams) {
    const {
      __ow_method,
      __ow_path,
      __ow_headers,
      __ow_body,
      __ow_query,
      ...rest
    } = fallbackParams;
    return rest as Record<string, string>;
  }

  return {};
}
