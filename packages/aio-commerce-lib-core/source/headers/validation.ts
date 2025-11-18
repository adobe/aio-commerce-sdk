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
 * Checks which headers are missing or empty from the headers object.
 * Performs case-insensitive lookup using {@link getHeader}.
 *
 * @param headers The headers object to check.
 * @param requiredHeaders Array of required header names.
 * @returns Array of missing header names (empty array if all present).
 */
export function getMissingHeaders(
  headers: Record<string, string | undefined>,
  requiredHeaders: string[],
): string[] {
  const missing: string[] = [];

  for (const header of requiredHeaders) {
    const value = getHeader(headers, header);
    const trimmedValue = String(value)?.trim();

    if (value === undefined || value === null || trimmedValue === "") {
      missing.push(header);
    }
  }

  return missing;
}

/**
 * Validates that required headers are present and non-empty in the headers object.
 * Performs case-insensitive validation with {@link getHeader}.
 *
 * @param headers The headers object to validate.
 * @param requiredHeaders Array of required header names.
 * @throws {Error} If any required headers are missing or empty.
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
 *   console.error(error.message); // "Missing required headers: x-api-key, Authorization"
 * }
 * ```
 */
export function assertRequiredHeaders(
  headers: Record<string, string | undefined>,
  requiredHeaders: string[],
): void {
  const missing = getMissingHeaders(headers, requiredHeaders);

  if (missing.length > 0) {
    throw new Error(`Missing required headers: [${missing.join(", ")}]`);
  }
}
