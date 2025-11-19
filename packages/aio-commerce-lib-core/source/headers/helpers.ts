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

import type { RuntimeActionParams } from "#params";
import type { HttpHeaders, HttpHeaderValue } from "./types";

/**
 * Extracts a header value from an object with case-insensitive lookup.
 * This is useful for handling HTTP headers which can be case-insensitive per RFC 7230.
 *
 * If a header value is a comma-separated string (per RFC 9110), it is automatically
 * split into an array. Headers that are already arrays are returned as-is.
 *
 * @param headers The headers object to search in.
 * @param name The header name to look for (case-insensitive).
 * @returns The header value as `string | string[] | undefined`. Comma-separated strings are split into arrays.
 *
 * @example
 * ```typescript
 * const headers = { authorization: "Bearer token123" };
 * const auth = getHeader(headers, "Authorization"); // "Bearer token123"
 * ```
 *
 * @example
 * ```typescript
 * // Comma-separated string is automatically split
 * const headers = { "Example-Field": "Foo, Bar" };
 * const value = getHeader(headers, "Example-Field"); // ["Foo", "Bar"]
 * ```
 *
 * @example
 * ```typescript
 * // Array values are returned as-is
 * const headers: HttpHeaders = { "Example-Field": ["Foo", "Bar"] };
 * const value = getHeader(headers, "Example-Field"); // ["Foo", "Bar"]
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc9110#name-field-lines-and-combined-fi
 */
export function getHeader(headers: HttpHeaders, name: string): HttpHeaderValue {
  let value: HttpHeaderValue;

  // Try exact match first for performance
  if (Object.hasOwn(headers, name)) {
    value = headers[name];
  } else {
    // Fall back to case-insensitive search
    const lowerName = name.toLowerCase();
    for (const key in headers) {
      if (Object.hasOwn(headers, key) && key.toLowerCase() === lowerName) {
        value = headers[key];
        break;
      }
    }
  }

  if (typeof value === "string" && value.includes(",")) {
    value = value.split(",").map((v) => v.trim());
  }

  return value;
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
 *   const headers = getHeadersFromParams(params);
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
