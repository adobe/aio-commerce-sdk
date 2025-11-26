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

import { literal, object, pipe, rawCheck, safeParse, string } from "valibot";

import { CommerceSdkValidationError } from "#error";

import { getHeader } from "./helpers";

import type { LiteralSchema } from "valibot";
import type { HttpHeaders } from "./types";

/**
 * Returns an array of missing or empty headers using Valibot validation.
 * Case-insensitive by default.
 */
export function getMissingOrEmptyHeaders(
  headers: HttpHeaders,
  requiredHeaders: string[],
): string[] {
  // Normalize headers to lowercase keys for validation
  // Skip undefined/null values as they should be treated as missing
  const normalized: Record<string, string> = {};

  // Handle null/undefined headers gracefully to avoid Object.keys() errors
  if (headers && typeof headers === "object" && !Array.isArray(headers)) {
    for (const key of Object.keys(headers)) {
      const value = headers[key];
      if (value !== undefined && value !== null) {
        normalized[key.toLowerCase()] = value;
      }
    }
  }

  const schema = buildHeadersSchema(requiredHeaders.map((h) => literal(h)));
  const parsed = safeParse(schema, normalized);

  if (parsed.success) {
    return [];
  }

  const lookup = new Map(requiredHeaders.map((h) => [h.toLowerCase(), h]));
  return parsed.issues.flatMap((issue) => {
    const key = issue.path?.[0]?.key;
    const original =
      typeof key === "string" ? lookup.get(key.toLowerCase()) : null;

    return original ? [original] : [];
  });
}

/**
 * Builds a Valibot schema that checks:
 * - Required headers exist (case-insensitive)
 * - Each required header has a non-empty string value
 */
function buildHeadersSchema<
  T extends LiteralSchema<string, string | undefined>[],
>(requiredHeaders: T) {
  const buildSchema = () =>
    pipe(
      string("Expected a string value for the header"),
      rawCheck(({ dataset, addIssue }) => {
        if (!dataset.typed) {
          return;
        }

        const value = dataset.value;

        // Check if it's empty or whitespace-only
        if (value.trim() === "") {
          addIssue({
            expected: "a non-empty string value",
            received: `"${value}"`,
            message: "Header value cannot be empty or contain only whitespace",
          });

          return;
        }

        // Check if comma-separated values are all empty
        if (value.includes(",")) {
          const parts = value.split(",").map((part) => part.trim());
          const hasNonEmptyPart = parts.some((part) => part !== "");

          if (!hasNonEmptyPart) {
            addIssue({
              expected: "at least one non-empty value in comma-separated list",
              received: `[${parts.join(", ")}]`,
              message:
                "Header value contains only empty or whitespace values when split by comma",
            });
          }
        }
      }),
    );

  const shape: Record<string, ReturnType<typeof buildSchema>> = {};

  for (const schema of requiredHeaders) {
    shape[schema.literal.toLowerCase()] = buildSchema();
  }

  return object(shape);
}

/**
 * Validates that required headers are present in the headers object.
 * Case-insensitive by default (HTTP standard).
 *
 * @param headers The headers object to validate.
 * @param requiredHeaders Array of required header names as LiteralSchemas.
 * @throws {CommerceSdkValidationError} If validation fails.
 */
export function assertRequiredHeadersSchema<
  T extends LiteralSchema<string, string | undefined>[],
>(headers: HttpHeaders, requiredHeaders: T) {
  // Normalize headers to lowercase keys for validation
  // Skip undefined/null values as they should be treated as missing
  const normalized: Record<string, string> = {};

  // Handle null/undefined headers gracefully to avoid Object.keys() errors
  if (headers && typeof headers === "object" && !Array.isArray(headers)) {
    for (const key of Object.keys(headers)) {
      const value = headers[key];
      if (value !== undefined && value !== null) {
        normalized[key.toLowerCase()] = value;
      }
    }
  }

  const schema = buildHeadersSchema(requiredHeaders);
  const parsed = safeParse(schema, normalized);

  if (!parsed.success) {
    throw new CommerceSdkValidationError(
      "The headers object does not match the required headers (case-insensitive)",
      { issues: parsed.issues },
    );
  }
}

/**
 * Validates that required headers are present and non-empty in the headers object.
 * Performs case-insensitive validation with {@link getHeader}.
 *
 * @param headers The headers object to validate.
 * @param requiredHeaders Array of required header names.
 * @throws {CommerceSdkValidationError} If any required headers are missing or empty.
 *
 * @example
 * ```typescript
 * const headers = { "x-api-key": "key123", "Authorization": "Bearer token" };
 * assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);
 * // Headers are validated, use getHeader() for safe access
 * const apiKey = getHeader(headers, "x-api-key")!;
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   assertRequiredHeaders({}, ["x-api-key", "Authorization"]);
 * } catch (error) {
 *   console.error(error.display());
 *   // "The headers object does not match the required headers (case-insensitive)"
 *  // ├── Schema validation error at x-api-key → Expected a non-empty string value
 *  // └── Schema validation error at Authorization → Expected a non-empty string value
 * }
 * ```
 */
export function assertRequiredHeaders(
  headers: HttpHeaders,
  requiredHeaders: string[],
) {
  assertRequiredHeadersSchema(
    headers,
    requiredHeaders.map((header) => literal(header)),
  );
}
