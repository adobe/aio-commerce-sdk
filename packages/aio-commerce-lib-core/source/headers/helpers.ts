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

import type { RuntimeActionParams } from "~/params";
import type { HttpHeaders } from "./types";

/**
 * Extracts a header value from an object with case-insensitive lookup.
 * This is useful for handling HTTP headers which can be case-insensitive per RFC 7230.
 *
 * @param headers The headers object to search in.
 * @param name The header name to look for (case-insensitive).
 *
 * @example
 * ```typescript
 * const headers = { authorization: "Bearer token123" };
 * const auth = getHeader(headers, "Authorization"); // "Bearer token123"
 * ```
 *
 * @example
 * ```typescript
 * const headers = { AUTHORIZATION: "Bearer token123" };
 * const auth = getHeader(headers, "authorization"); // "Bearer token123"
 * ```
 */
export function getHeader(
  headers: HttpHeaders,
  name: string,
): string | undefined {
  // Try exact match first for performance
  if (Object.hasOwn(headers, name)) {
    return headers[name];
  }

  // Fall back to case-insensitive search
  const lowerName = name.toLowerCase();
  for (const key in headers) {
    if (Object.hasOwn(headers, key) && key.toLowerCase() === lowerName) {
      return headers[key];
    }
  }

  return;
}

/**
 * Extracts the `__ow_headers` object from App Builder runtime action parameters.
 *
 * @param params The action parameters from App Builder runtime.
 * @throws {Error} If `__ow_headers` is missing or not an object.
 *
 * @example
 * ```typescript
 * export async function main(params) {
 *   const headers = extractRuntimeHeaders(params);
 *   const apiKey = headers["x-api-key"];
 * }
 * ```
 */
export function getHeadersFromParams(params: RuntimeActionParams): HttpHeaders {
  if (!params.__ow_headers || typeof params.__ow_headers !== "object") {
    throw new Error("Missing __ow_headers in action params");
  }

  return params.__ow_headers;
}
