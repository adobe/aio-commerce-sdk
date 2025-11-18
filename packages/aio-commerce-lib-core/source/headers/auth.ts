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
 * Extracts and validates a Bearer token from an Authorization header.
 *
 * @param authorization The Authorization header value.
 * @throws {Error} If the authorization header is not a Bearer token or if the token is empty.
 *
 * @example
 * ```typescript
 * const token = parseBearerToken("Bearer eyJhbGci..."); // "eyJhbGci..."
 * ```
 *
 * @example
 * ```typescript
 * try {
 *   parseBearerToken("Basic dXNlcjpwYXNz");
 * } catch (error) {
 *   console.error(error.message); // "Authorization header must be a Bearer token"
 * }
 * ```
 */
export function parseBearerToken(authorization: string): string {
  const BEARER_PREFIX = "Bearer ";

  if (!authorization.startsWith(BEARER_PREFIX)) {
    throw new Error("Authorization header must be a Bearer token");
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();
  if (token === "") {
    throw new Error("Bearer token cannot be empty");
  }

  return token;
}
