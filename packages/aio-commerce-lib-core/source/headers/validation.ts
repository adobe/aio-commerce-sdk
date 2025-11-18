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

import { getHeader } from "./helpers";

/**
 * Validates that required headers are present and non-empty in the headers object.
 * Uses type narrowing to ensure TypeScript knows the headers exist after validation.
 *
 * @param headers The headers object to validate.
 * @param requiredHeaders Array of required header names.
 * @throws {Error} If any required headers are missing or empty.
 *
 * @example
 * ```typescript
 * const headers = { "x-api-key": "key123", "Authorization": "Bearer token" };
 * assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);
 * // TypeScript now knows headers["x-api-key"] and headers["Authorization"] are non-empty strings
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   assertRequiredHeaders({}, ["x-api-key", "Authorization"]);
 * } catch (error) {
 *   console.error(error.message); // "Missing required headers: x-api-key, Authorization"
 * }
 * ```
 */
export function assertRequiredHeaders<const T extends string[]>(
  headers: Record<string, string | undefined>,
  requiredHeaders: T,
): asserts headers is Record<string, string | undefined> &
  Record<T[number], string> {
  const missing: string[] = [];

  for (const header of requiredHeaders) {
    const value = getHeader(headers, header);
    const trimmedValue = String(value)?.trim();

    if (value === undefined || value === null || trimmedValue === "") {
      missing.push(header);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required headers: ${missing.join(", ")}`);
  }
}
