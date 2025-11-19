# Headers Utilities Guide

The `@adobe/aio-commerce-lib-core/headers` module provides helper functions for working with HTTP headers in Adobe I/O Runtime actions.

## Overview

When building Adobe I/O Runtime actions, you often need to:

- Extract headers from incoming requests
- Validate required authentication headers
- Parse Bearer tokens
- Handle case-insensitive header names

This module provides utilities to simplify these common tasks.

## getHeadersFromParams

Extracts the `__ow_headers` object from App Builder runtime action parameters.

```typescript
import { getHeadersFromParams } from "@adobe/aio-commerce-lib-core/headers";

export async function main(params) {
  const headers = getHeadersFromParams(params);

  // Access headers (case-sensitive)
  const apiKey = headers["x-api-key"];
  const auth = headers["Authorization"];
}
```

### Error Handling

The function throws an error if `__ow_headers` is missing or invalid:

```typescript
try {
  const headers = getHeadersFromParams(params);
} catch (error) {
  return {
    statusCode: 400,
    body: { error: "Invalid request: missing headers" },
  };
}
```

## getHeader

Extracts a header value with case-insensitive lookup. This is useful because HTTP headers are case-insensitive, but JavaScript objects are case-sensitive.

```typescript
import { getHeader } from "@adobe/aio-commerce-lib-core/headers";

const headers = {
  authorization: "Bearer token123", // lowercase
  "x-api-key": "key123",
};

// Works with any casing
getHeader(headers, "Authorization"); // "Bearer token123"
getHeader(headers, "AUTHORIZATION"); // "Bearer token123"
getHeader(headers, "authorization"); // "Bearer token123"
```

### Priority

Exact match is prioritized first for performance, then falls back to case-insensitive search:

```typescript
const headers = {
  authorization: "Bearer lowercase",
  Authorization: "Bearer uppercase",
};

getHeader(headers, "Authorization"); // "Bearer uppercase" (exact match)
getHeader(headers, "authorization"); // "Bearer lowercase" (exact match)
getHeader(headers, "AUTHORIZATION"); // "Bearer uppercase" (case-insensitive fallback)
```

### Multiple Header Values (RFC 9110)

According to RFC 9110, when a header appears multiple times, the HTTP server/runtime MAY combine (not necessarily) the values with commas. `getHeader` automatically splits comma-separated strings into arrays:

```typescript
// Header appeared multiple times in request:
// cache-control: no-store
// cache-control: no-cache
// Runtime combines to: "no-store, no-cache"

const headers = {
  "cache-control": "no-store, no-cache", // Comma-separated string from runtime
  "x-api-key": "key123",
};

const value = getHeader(headers, "cache-control");
// Returns: ["Foo", "Bar"] (automatically split into array)
```

Single values without commas are returned as strings:

```typescript
const headers = {
  "cache-control": "no-store",
  "x-api-key": "key123",
};

const value = getHeader(headers, "cache-control");
// Returns: "no-store" (string, not array)
```

**Return Type**: `getHeader` returns `string | string[] | undefined`:

- `string` - Single header value (no commas)
- `string[]` - Multiple header values (comma-separated string was automatically split)
- `undefined` - Header not found

## assertRequiredHeaders

Validates that required headers are present and non-empty. Performs case-insensitive validation.

```typescript
import {
  getHeadersFromParams,
  assertRequiredHeaders,
  getHeader,
} from "@adobe/aio-commerce-lib-core/headers";

export async function main(params) {
  const headers = getHeadersFromParams(params);

  // Validate required headers (case-insensitive)
  assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);

  // Use getHeader() for safe case-insensitive access
  const apiKey = getHeader(headers, "x-api-key")!;
  const auth = getHeader(headers, "Authorization")!;
}
```

### Error Messages

The function provides clear error messages:

```typescript
// Missing one header
assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);
// Error: Missing required headers: [Authorization]

// Missing multiple headers
assertRequiredHeaders(headers, ["x-api-key", "Authorization", "x-custom"]);
// Error: Missing required headers: [x-api-key, Authorization, x-custom]
```

## createHeaderAccessor

Creates a type-safe accessor object with validated headers. Header names are normalized to camelCase for consistent access.

```typescript
import {
  getHeadersFromParams,
  createHeaderAccessor,
} from "@adobe/aio-commerce-lib-core/headers";

export async function main(params) {
  const headers = getHeadersFromParams(params);

  // Create accessor with camelCase keys
  const { xApiKey, authorization } = createHeaderAccessor(headers, [
    "x-api-key",
    "Authorization",
  ]);

  // TypeScript knows these are non-empty strings
  console.log(xApiKey); // string
  console.log(authorization); // string
}
```

### Benefits

- **Type-safe**: TypeScript knows the exact keys and that they're strings
- **Normalized**: Header names become clean camelCase (no weird casing)
- **Validated**: Throws if any required headers are missing
- **Case-insensitive**: Finds headers regardless of original casing

### What is Considered Empty?

Headers are considered empty if they are:

- `undefined`
- `null`
- Empty string (`""`)
- Whitespace-only (`"   "`, `"\t"`, etc.)

## Authorization Parsing

The module provides utilities for parsing different authorization schemes from HTTP Authorization headers.

### parseAuthorization

Parses any authorization header into a discriminated union type. This is the base function used by specialized parsers.

```typescript
import { parseAuthorization } from "@adobe/aio-commerce-lib-core/headers";

const bearerAuth = parseAuthorization("Bearer token123");
// { scheme: "Bearer", token: "token123" }

const basicAuth = parseAuthorization("Basic dXNlcjpwYXNz");
// { scheme: "Basic", credentials: "dXNlcjpwYXNz" }

const oauthAuth = parseAuthorization('OAuth oauth_token="abc"');
// { scheme: "OAuth", parameters: { oauth_token: "abc" } }

const digestAuth = parseAuthorization('Digest realm="Example"');
// { scheme: "Digest", parametersRaw: 'realm="Example"', parameters: { realm: "Example" } }
```

### parseBearerToken

Extracts and validates a Bearer token from an Authorization header. Returns a `BearerAuthorization` object.

```typescript
import { parseBearerToken } from "@adobe/aio-commerce-lib-core/headers";

const authorization = "Bearer eyJhbGci...";
const auth = parseBearerToken(authorization);
// { scheme: "Bearer", token: "eyJhbGci..." }

console.log(auth.token); // "eyJhbGci..."
```

### Validation

The function performs several validations:

1. **Must be a Bearer token**

   ```typescript
   parseBearerToken("Basic dXNlcjpwYXNz");
   // Error: Authorization header must be a Bearer token
   ```

2. **Token cannot be empty**

   ```typescript
   parseBearerToken("Bearer");
   // Error: Invalid Authorization header format

   parseBearerToken("Bearer    ");
   // Error: Invalid Authorization header format
   ```

3. **Whitespace is trimmed**
   ```typescript
   const auth = parseBearerToken("Bearer   token123   ");
   console.log(auth.token); // "token123"
   ```

### parseBasicToken

Parses and validates a Basic authorization header. Returns a `BasicAuthorization` object.

```typescript
import { parseBasicToken } from "@adobe/aio-commerce-lib-core/headers";

const auth = parseBasicToken("Basic dXNlcjpwYXNz");
// { scheme: "Basic", credentials: "dXNlcjpwYXNz" }

console.log(auth.credentials); // "dXNlcjpwYXNz"
```

### parseOAuthToken

Parses and validates an OAuth 1.0 authorization header. Returns an `OAuth1Authorization` object with structured parameters.

```typescript
import { parseOAuthToken } from "@adobe/aio-commerce-lib-core/headers";

const auth = parseOAuthToken(
  'OAuth oauth_consumer_key="key", oauth_token="token"',
);
// {
//   scheme: "OAuth",
//   parameters: {
//     oauth_consumer_key: "key",
//     oauth_token: "token"
//   }
// }
```

The function parses OAuth 1.0 parameters according to RFC 5849, extracting key-value pairs from the authorization string.

### Type Guards and Discriminated Unions

The `Authorization` type is a discriminated union, but **TypeScript cannot automatically narrow** based on `scheme === "Bearer"` checks when `GenericAuthorization` is in the union (because `GenericAuthorization.scheme` is `string`, which includes all string literals).

**Always use type guards** for reliable type narrowing:

```typescript
import {
  parseAuthorization,
  isBearerAuth,
  isBasicAuth,
  isOAuth,
} from "@adobe/aio-commerce-lib-core/headers";

const auth = parseAuthorization("Bearer token123");

// ✅ Use type guards for type narrowing
if (isBearerAuth(auth)) {
  // TypeScript knows auth is BearerAuthorization here
  console.log(auth.token); // ✅ Type-safe
}

if (isBasicAuth(auth)) {
  // TypeScript knows auth is BasicAuthorization here
  console.log(auth.credentials); // ✅ Type-safe
}

if (isOAuth(auth)) {
  // TypeScript knows auth is OAuth1Authorization here
  console.log(auth.parameters.oauth_token); // ✅ Type-safe
}

// ❌ Direct scheme checks do NOT work for type narrowing
if (auth.scheme === "Bearer") {
  // TypeScript cannot narrow here - auth.token will cause an error
  // console.log(auth.token); // ❌ Error: Property 'token' does not exist
}
```

## Best Practices

### 1. Use createHeaderAccessor for Type Safety

```typescript
// ✅ Recommended - type-safe camelCase keys
const { xApiKey, authorization } = createHeaderAccessor(headers, [
  "x-api-key",
  "Authorization",
]);

// ❌ Less safe - requires non-null assertions
assertRequiredHeaders(headers, ["x-api-key", "Authorization"]);
const apiKey = getHeader(headers, "x-api-key")!;
```

### 2. Handle Errors Appropriately

```typescript
import { badRequest } from "@adobe/aio-commerce-lib-core/responses";

export async function main(params) {
  try {
    const headers = getHeadersFromParams(params);
    const { xApiKey } = createHeaderAccessor(headers, ["x-api-key"]);
  } catch (error) {
    return badRequest({ body: { error: error.message } });
  }

  // Continue with validated headers...
}
```

### 3. Use getHeader for Dynamic Access

```typescript
// When you need dynamic/optional headers, use getHeader
const customHeader = getHeader(headers, "x-custom-header");
if (customHeader) {
  // Use it...
}
```
