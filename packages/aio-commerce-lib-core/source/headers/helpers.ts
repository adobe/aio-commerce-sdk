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

/**
 * Extracts a header value from an object, checking both lowercase and capitalized variations.
 * This is useful for handling HTTP headers which can be case-insensitive.
 *
 * @param headers The headers object to search in.
 * @param name The header name to look for (will check both lowercase and original casing).
 *
 * @example
 * ```typescript
 * const headers = { authorization: "Bearer token123" };
 * const auth = getHeader(headers, "Authorization"); // "Bearer token123"
 * ```
 *
 * @example
 * ```typescript
 * const headers = { Authorization: "Bearer token123" };
 * const auth = getHeader(headers, "authorization"); // "Bearer token123"
 * ```
 */
export function getHeader(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  return headers[name.toLowerCase()] ?? headers[name];
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
export function getHeadersFromParams(
  params: Record<string, unknown>,
): Record<string, string | undefined> {
  if (!params.__ow_headers || typeof params.__ow_headers !== "object") {
    throw new Error("Missing __ow_headers in action params");
  }

  return params.__ow_headers as Record<string, string | undefined>;
}
