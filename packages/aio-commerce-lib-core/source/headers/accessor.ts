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
import { assertRequiredHeaders } from "./validation";

import type {
  GetHeaderOptions,
  HttpHeaderAccessorMap,
  HttpHeaders,
} from "./types";

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
export function createHeaderAccessor<
  const T extends string[],
  const O extends GetHeaderOptions | undefined = undefined,
>(
  headers: HttpHeaders,
  requiredHeaders: T,
  options?: O,
): HttpHeaderAccessorMap<T, O> {
  assertRequiredHeaders(headers, requiredHeaders);

  // Build accessor object with camelCase keys
  const accessor: Record<string, string | string[]> = {};

  for (const header of requiredHeaders) {
    const camelKey = camelcase(header);
    const value = getHeader(headers, header, options);

    // We know value is defined because assertRequiredHeaders passed
    accessor[camelKey] = value as string | string[];
  }

  return accessor as HttpHeaderAccessorMap<T, O>;
}
