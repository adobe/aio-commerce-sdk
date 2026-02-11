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
 * Parses a request body from OpenWhisk/Runtime.
 * Handles multiple formats:
 * - Base64-encoded strings (__ow_body)
 * - Already-parsed objects
 * - Body properties mixed into args (web actions with JSON content-type)
 *
 * @param owBody - Body from __ow_body (base64 string, JSON string, or object)
 * @param args - Full args object to extract body from if __ow_body is not present
 *
 * @example
 * ```typescript
 * const body = parseRequestBody(params.__ow_body, params);
 * ```
 */
export function parseRequestBody(
  owBody?: unknown,
  args?: Record<string, unknown>,
): unknown {
  if (owBody) {
    if (typeof owBody === "object") {
      return owBody;
    }

    if (typeof owBody === "string") {
      try {
        return JSON.parse(owBody);
      } catch {
        // Not valid JSON, try base64 decoding
      }

      try {
        const decoded = Buffer.from(owBody, "base64").toString();
        return JSON.parse(decoded);
      } catch {
        // Fall through to args extraction
      }
    }
  }

  // For web actions with JSON content-type, body properties are merged into args
  // Extract non-__ow_* properties as the body
  if (args && typeof args === "object") {
    const body: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      if (!key.startsWith("__ow_")) {
        body[key] = value;
      }
    }

    return body;
  }

  return {};
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
