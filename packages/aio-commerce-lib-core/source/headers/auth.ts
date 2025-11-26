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
 * Represents a Bearer authentication scheme (RFC 6750).
 */
export type BearerAuthorization = {
  scheme: "Bearer";
  token: string;
};

/**
 * Represents a Basic authentication scheme (RFC 7617).
 */
export type BasicAuthorization = {
  scheme: "Basic";
  credentials: string;
};

/**
 * OAuth 1.0 parameters as defined in RFC 5849.
 */
export type OAuth1Parameters = {
  oauth_consumer_key: string;
  oauth_token?: string;
  oauth_signature_method: string;
  oauth_signature: string;
  oauth_timestamp: string;
  oauth_nonce: string;
  oauth_version?: string;
  realm?: string;
  [key: string]: string | undefined;
};

/**
 * Represents an OAuth 1.0 authentication scheme (RFC 5849).
 */
export type OAuth1Authorization = {
  scheme: "OAuth";
  parameters: OAuth1Parameters;
};

/**
 * Represents a generic/unknown authentication scheme.
 * The scheme must not be one of the known types (Bearer, Basic, OAuth).
 *
 * @remarks
 * TypeScript cannot automatically narrow discriminated unions when `GenericAuthorization`
 * has `scheme: string` because `string` includes all possible string literals including
 * "Bearer", "Basic", and "OAuth". Use the provided type guards (`isBearerAuth`,
 * `isBasicAuth`, `isOAuth`) for reliable type narrowing.
 */
export type GenericAuthorization = {
  scheme: string;
  rawParameters: string;

  parseParameters: () => Record<string, string>;
};

/**
 * Discriminated union of all authorization types.
 *
 * @remarks
 * **Type Narrowing Limitation**: TypeScript cannot automatically narrow this union based
 * on `scheme === "Bearer"` checks when `GenericAuthorization` is in the union, because
 * `GenericAuthorization.scheme` is `string`, which includes all string literals.
 *
 * **Recommended**: Use the provided type guards for reliable type narrowing:
 * - `isBearerAuth(auth)` - narrows to `BearerAuthorization`
 * - `isBasicAuth(auth)` - narrows to `BasicAuthorization`
 * - `isOAuth(auth)` - narrows to `OAuth1Authorization`
 *
 * @example
 * ```typescript
 * const auth = parseAuthorization("Bearer token123");
 *
 * // ❌ This does NOT work - TypeScript cannot narrow automatically
 * if (auth.scheme === "Bearer") {
 *   auth.token; // Error: Property 'token' does not exist
 * }
 *
 * // ✅ Use type guards instead
 * if (isBearerAuth(auth)) {
 *   auth.token; // ✅ Works - TypeScript knows auth is BearerAuthorization
 * }
 * ```
 */
export type Authorization =
  | BearerAuthorization
  | BasicAuthorization
  | OAuth1Authorization
  | GenericAuthorization;

/**
 * Type guard to check if authorization is Bearer type.
 */
export function isBearerAuth(auth: Authorization): auth is BearerAuthorization {
  return auth.scheme === "Bearer";
}

/**
 * Type guard to check if authorization is Basic type.
 */
export function isBasicAuth(auth: Authorization): auth is BasicAuthorization {
  return auth.scheme === "Basic";
}

/**
 * Type guard to check if authorization is OAuth type.
 */
export function isOAuth(auth: Authorization): auth is OAuth1Authorization {
  return auth.scheme === "OAuth";
}

/**
 * Parses key="value" or key=value parameters from a string.
 * Used for OAuth and other schemes with comma-separated key-value pairs.
 *
 * @param parametersString The parameters string.
 */
function parseKeyValueParameters(
  parametersString: string,
): Record<string, string> {
  const params: Record<string, string> = {};

  // Match key="value" or key=value pairs
  // Quoted values: key="value" (value can contain any character except ")
  // Unquoted values: key=value (value stops at comma, space, or end of string)
  const paramPattern = /(\w+)=(?:"([^"]*)"|([^,\s]+))/g;
  let match = paramPattern.exec(parametersString);

  while (match !== null) {
    const [, key, quotedValue, unquotedValue] = match;
    if (key) {
      // Use quoted value if present, otherwise use unquoted value
      const value = quotedValue !== undefined ? quotedValue : unquotedValue;
      if (value !== undefined) {
        params[key] = value;
      }
    }

    match = paramPattern.exec(parametersString);
  }

  return params;
}

/**
 * Parses an Authorization header value into its scheme and parameters.
 *
 * @param authorization The Authorization header value.
 * @throws {Error} If the authorization header is malformed.
 *
 * @example
 * ```typescript
 * const auth = parseAuthorization("Bearer token123");
 * // { scheme: "Bearer", token: "token123" }
 * ```
 *
 * @example
 * ```typescript
 * const auth = parseAuthorization("Basic dXNlcjpwYXNz");
 * // { scheme: "Basic", credentials: "dXNlcjpwYXNz" }
 * ```
 *
 * @example
 * ```typescript
 * const auth = parseAuthorization('OAuth oauth_consumer_key="key", oauth_token="token"');
 * // { scheme: "OAuth", parameters: { oauth_consumer_key: "key", oauth_token: "token" } }
 * ```
 *
 * @example
 * ```typescript
 * const auth = parseAuthorization('Digest realm="Example", nonce="abc"');
 * // { scheme: "Digest", rawParameters: 'realm="Example", nonce="abc"' }
 *
 * const parameters = auth.parseParameters();
 * // { realm: "Example", nonce: "abc" }
 * ```
 */
export function parseAuthorization(authorization: string): Authorization {
  const trimmed = authorization.trim();
  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    throw new Error("Invalid Authorization header format");
  }

  const scheme = trimmed.slice(0, spaceIndex);
  const parameters = trimmed.slice(spaceIndex + 1).trim();

  // Note: scheme and parameters cannot be empty here because:
  // - scheme === "" would require spaceIndex === 0, but trim() removes leading spaces
  // - parameters === "" would require space followed by only whitespace, but trim() removes trailing whitespace
  // Both cases are already caught by the spaceIndex === -1 check above

  // Return discriminated union based on scheme
  if (scheme === "Bearer") {
    return {
      scheme: "Bearer",
      token: parameters,
    };
  }

  if (scheme === "Basic") {
    return {
      scheme: "Basic",
      credentials: parameters,
    };
  }

  if (scheme === "OAuth") {
    return {
      scheme: "OAuth",
      parameters: parseKeyValueParameters(parameters) as OAuth1Parameters,
    };
  }

  return {
    scheme,
    rawParameters: parameters,

    parseParameters: () => parseKeyValueParameters(parameters),
  };
}

/**
 * Parses and validates a Bearer authorization header.
 *
 * @param authorization The Authorization header value.
 * @throws {Error} If the authorization header is not a Bearer token or if the token is empty.
 *
 * @example
 * ```typescript
 * const auth = parseBearerToken("Bearer eyJhbGci...");
 * console.log(auth.token); // "eyJhbGci..."
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
export function parseBearerToken(authorization: string): BearerAuthorization {
  const auth = parseAuthorization(authorization);

  if (!isBearerAuth(auth)) {
    throw new Error("Authorization header must be a Bearer token");
  }

  return auth;
}

/**
 * Parses and validates a Basic authorization header.
 *
 * @param authorization The Authorization header value.
 * @throws {Error} If the authorization header is not Basic auth.
 *
 * @example
 * ```typescript
 * const auth = parseBasicToken("Basic dXNlcjpwYXNz");
 * console.log(auth.credentials); // "dXNlcjpwYXNz"
 * ```
 */
export function parseBasicToken(authorization: string): BasicAuthorization {
  const auth = parseAuthorization(authorization);

  if (!isBasicAuth(auth)) {
    throw new Error("Authorization header must be Basic authentication");
  }

  return auth;
}

/**
 * Parses and validates an OAuth 1.0 authorization header.
 *
 * @param authorization The Authorization header value.
 * @throws {Error} If the authorization header is not OAuth.
 *
 * @example
 * ```typescript
 * const auth = parseOAuthToken('OAuth oauth_consumer_key="key", oauth_token="token"');
 * console.log(auth.parameters.oauth_consumer_key); // "key"
 * console.log(auth.parameters.oauth_token); // "token"
 * ```
 */
export function parseOAuthToken(authorization: string): OAuth1Authorization {
  const auth = parseAuthorization(authorization);

  if (!isOAuth(auth)) {
    throw new Error("Authorization header must be OAuth");
  }

  return auth;
}
