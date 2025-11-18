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

import { getHeader } from "./helpers";
import { getMissingHeaders } from "./validation";

import type { CamelCase } from "type-fest";

/**
 * Creates a type-safe header accessor object with validated required headers.
 * Header names are normalized to camelCase for consistent access.
 *
 * @param headers The headers object from runtime params.
 * @param requiredHeaders Array of required header names.
 * @throws {Error} If any required headers are missing or empty.
 *
 * @example
 * ```typescript
 * const headers = getHeadersFromParams(params);
 * const accessor = createHeaderAccessor(headers, ["x-api-key", "Authorization"]);
 *
 * // TypeScript knows these are non-empty strings (normalized to camelCase)
 * const apiKey = accessor.xApiKey;       // string
 * const auth = accessor.authorization;   // string
 * ```
 */
export function createHeaderAccessor<const T extends string[]>(
  headers: Record<string, string | undefined>,
  requiredHeaders: T,
): { [K in T[number] as CamelCase<K>]: string } {
  const missing = getMissingHeaders(headers, requiredHeaders);

  if (missing.length > 0) {
    throw new Error(`Missing required headers: [${missing.join(", ")}]`);
  }

  // Build accessor object with camelCase keys
  const accessor: Record<string, string> = {};

  for (const header of requiredHeaders) {
    const camelKey = camelcase(header);
    const value = getHeader(headers, header);

    // We know value is defined because getMissingHeaders passed
    if (value !== undefined) {
      accessor[camelKey] = value;
    }
  }

  return accessor as { [K in T[number] as CamelCase<K>]: string };
}
