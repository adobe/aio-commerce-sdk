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

import {
  object,
  record,
  safeParse,
  string,
  union,
  undefined as vUndefined,
} from "valibot";

import { CommerceSdkValidationError } from "#error/index";

import type { RuntimeActionParams } from "#params/index";
import type {
  GetHeaderOptions,
  GetHeaderReturn,
  HttpHeaders,
  HttpHeaderValue,
} from "./types";

/**
 * Extracts a header value from an object with case-insensitive lookup.
 * This is useful for handling HTTP headers which can be case-insensitive per RFC 7230.
 *
 * When enabled via options, comma-separated header values (per RFC 9110) can be
 * automatically split into an array. This is useful when multiple header values
 * are combined into a single comma-separated string.
 *
 * @param headers The headers object to search in.
 * @param name The header name to look for (case-insensitive).
 * @param options Optional settings to control header value processing.
 *
 * @example
 * ```typescript
 * const headers = { authorization: "Bearer token123" };
 * const auth = getHeader(headers, "Authorization"); // "Bearer token123"
 * ```
 *
 * @example
 * ```typescript
 * // Comma-separated string can be split when enabled (per RFC 9110)
 * const headers = { "Example-Field": "Foo, Bar" };
 * const value = getHeader(headers, "Example-Field", { splitCommaSeparated: true }); // ["Foo", "Bar"]
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7230 - HTTP/1.1 Message Syntax and Routing
 * @see https://datatracker.ietf.org/doc/html/rfc9110#name-field-lines-and-combined-fi - HTTP Semantics: Field Lines and Combined Field Values
 */
export function getHeader<T extends GetHeaderOptions | undefined = undefined>(
  headers: HttpHeaders,
  name: string,
  options?: T,
): GetHeaderReturn<T> {
  const { splitCommaSeparated = false } = options ?? {};

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

  if (splitCommaSeparated && typeof value === "string" && value.includes(",")) {
    value = value.split(",").map((v) => v.trim());
  }

  return value as GetHeaderReturn<T>;
}

/**
 * Extracts the `__ow_headers` object from App Builder runtime action parameters.
 *
 * @param params The action parameters from App Builder runtime.
 * @throws {CommerceSdkValidationError} If `__ow_headers` is missing or not an object.
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
  const schema = object({
    __ow_headers: record(string(), union([string(), vUndefined()])),
  });

  const parsed = safeParse(schema, params);
  if (!parsed.success) {
    throw new CommerceSdkValidationError(
      "Missing __ow_headers in action params",
      { issues: parsed.issues },
    );
  }

  return parsed.output.__ow_headers;
}
