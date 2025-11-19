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

## parseBearerToken

Extracts and validates a Bearer token from an Authorization header.

```typescript
import { parseBearerToken } from "@adobe/aio-commerce-lib-core/headers";

const authorization = "Bearer eyJhbGci...";
const token = parseBearerToken(authorization); // "eyJhbGci..."
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
   parseBearerToken("Bearer ");
   // Error: Bearer token cannot be empty

   parseBearerToken("Bearer    ");
   // Error: Bearer token cannot be empty
   ```

3. **Whitespace is trimmed**
   ```typescript
   parseBearerToken("Bearer   token123   "); // "token123"
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
