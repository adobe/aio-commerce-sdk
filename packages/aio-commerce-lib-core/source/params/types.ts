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
 * Standard HTTP methods supported by Adobe I/O Runtime.
 * These are the methods that can be used when invoking runtime actions via HTTP.
 */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

/**
 * Lowercase HTTP method as sent by OpenWhisk/Adobe I/O Runtime.
 * OpenWhisk sends methods in lowercase (e.g., "get", "post").
 */
export type HttpMethodLowercase = Lowercase<HttpMethod>;

/** The type of the runtime action parameters. */
export type RuntimeActionParams = {
  /** If the runtime action is invoked via HTTP, this will be the headers of the request. */
  __ow_headers?: Record<string, string | undefined>;

  /** If the runtime action is invoked via HTTP, this will be the HTTP method of the request. */
  __ow_method?: HttpMethodLowercase;

  /** If the runtime action is invoked via HTTP, this will be the unmatched path of the request (matching stops after consuming the action extension) */
  __ow_path?: string;

  /** If the runtime action is invoked via HTTP, this will be the request body entity, as a base64-encoded string when its content is binary or JSON object/array, or as a plain string otherwise */
  __ow_body?: string;

  /** If the runtime action is invoked via HTTP, this will be the query parameters of the request, as an unparsed string. */
  __ow_query?: string;

  // Remaining unknown properties.
  [key: string]: unknown;
};
