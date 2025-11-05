# Response Helpers Guide

The `@adobe/aio-commerce-lib-core/responses` module provides standardized response builders for Adobe I/O Runtime actions, following the [App Builder runtime action response format](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions).

## Creating Success Responses

Use `createSuccessResponse` or the convenient presets like `ok` and `created`:

```typescript
import { ok, created } from "@adobe/aio-commerce-lib-core/responses";

// Simple success response
return ok({
  message: "Operation successful",
});

// Success with additional data
return ok({
  message: "User retrieved",
  body: { id: "123", name: "John Doe", email: "john@example.com" },
});

// Created response with location header
return created({
  message: "Resource created",
  body: { id: "456" },
  headers: { Location: "/api/resources/456" },
});
```

## Creating Error Responses

Use `createErrorResponse` or the convenient presets like `badRequest`, `notFound`, etc.:

```typescript
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  internalServerError,
} from "@adobe/aio-commerce-lib-core/responses";

// Bad request with validation details
return badRequest({
  message: "Invalid input",
  body: { field: "email", code: "INVALID_FORMAT" },
});

// Authentication error
return unauthorized({
  message: "Authentication required",
  headers: { "WWW-Authenticate": 'Bearer realm="api"' },
});

// Access denied
return forbidden({
  message: "Insufficient permissions",
  body: { requiredRole: "admin", currentRole: "user" },
});

// Resource not found
return notFound({
  message: "User not found",
  body: { resourceId: "123" },
});

// Server error
return internalServerError({
  message: "An unexpected error occurred",
  body: { errorId: "err-abc-123" },
});
```

## Available Response Presets

The library provides the following convenience functions:

- `ok(payload)` - HTTP 200 (Success)
- `created(payload)` - HTTP 201 (Created)
- `badRequest(payload)` - HTTP 400 (Bad Request)
- `unauthorized(payload)` - HTTP 401 (Unauthorized)
- `forbidden(payload)` - HTTP 403 (Forbidden)
- `notFound(payload)` - HTTP 404 (Not Found)
- `internalServerError(payload)` - HTTP 500 (Internal Server Error)

All presets accept a payload with a required `message` field, and optional `body` and `headers` fields.

## Type Discrimination

Response objects include a `type` discriminator for type-safe handling:

```typescript
import { ok, badRequest } from "@adobe/aio-commerce-lib-core/responses";

const response =
  Math.random() > 0.5
    ? ok({ message: "Success" })
    : badRequest({ message: "Error" });

if (response.type === "success") {
  console.log(`Status: ${response.statusCode}`);
  console.log(`Body: ${response.body}`);
} else {
  console.log(`Error Status: ${response.error.statusCode}`);
  console.log(`Error Body: ${response.error.body}`);
}
```

This allows TypeScript to narrow the type and provide accurate autocomplete and type checking.

## Custom Status Codes

For custom status codes not covered by the presets, use the base functions directly:

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
} from "@adobe/aio-commerce-lib-core/responses";

// 204 No Content
const noContent = createSuccessResponse(204, {
  message: "Resource deleted",
});

// 429 Rate Limited
const rateLimited = createErrorResponse(429, {
  message: "Too many requests",
  headers: { "Retry-After": "60" },
});

// 503 Service Unavailable
const unavailable = createErrorResponse(503, {
  message: "Service temporarily unavailable",
  body: { retryAfter: 300 },
});
```
