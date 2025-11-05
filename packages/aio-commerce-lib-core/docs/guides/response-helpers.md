# Response Helpers Guide

The `@adobe/aio-commerce-lib-core/responses` module provides standardized response builders for Adobe I/O Runtime actions, following the [App Builder runtime action response format](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions).

## Creating Success Responses

Use `buildSuccessResponse` or the convenient presets like `ok` and `created`:

```typescript
import { ok, created } from "@adobe/aio-commerce-lib-core/responses";

// Success response without payload (e.g., 204 No Content)
return ok();

// Simple success response using string shorthand
return ok("Operation successful");

// Equivalent to the above, using full object syntax
return ok({
  body: { message: "Operation successful" },
});

// Success with additional data
return ok({
  body: {
    message: "User retrieved",
    id: "123",
    name: "John Doe",
    email: "john@example.com",
  },
});

// Created response with location header
return created({
  body: { message: "Resource created", id: "456" },
  headers: { Location: "/api/resources/456" },
});
```

Success responses spread the body properties directly into the response object, making them easy to work with. The payload parameter is optional, allowing you to create responses without any body or headers.

**String Shorthand:** For convenience, you can pass a string directly to any preset function. It will be automatically converted to `{ body: { message: yourString } }`.

## Creating Error Responses

Use `buildErrorResponse` or the convenient presets like `badRequest`, `notFound`, etc.:

```typescript
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  internalServerError,
} from "@adobe/aio-commerce-lib-core/responses";

// Simple error using string shorthand
return badRequest("Invalid input");

// Equivalent to the above, using full object syntax
return badRequest({
  body: { message: "Invalid input" },
});

// Bad request with validation details
return badRequest({
  body: {
    message: "Invalid input",
    field: "email",
    code: "INVALID_FORMAT",
  },
});

// Authentication error with headers
return unauthorized({
  body: { message: "Authentication required" },
  headers: { "WWW-Authenticate": 'Bearer realm="api"' },
});

// Access denied with additional data
return forbidden({
  body: {
    message: "Insufficient permissions",
    requiredRole: "admin",
    currentRole: "user",
  },
});

// Resource not found
return notFound({
  body: {
    message: "User not found",
    resourceId: "123",
  },
});

// Server error
return internalServerError({
  body: {
    message: "An unexpected error occurred",
    errorId: "err-abc-123",
  },
});
```

## Available Response Presets

The library provides the following convenience functions:

- `ok(payload?)` - HTTP 200 (Success)
- `created(payload?)` - HTTP 201 (Created)
- `badRequest(payload)` - HTTP 400 (Bad Request)
- `unauthorized(payload)` - HTTP 401 (Unauthorized)
- `forbidden(payload)` - HTTP 403 (Forbidden)
- `notFound(payload)` - HTTP 404 (Not Found)
- `internalServerError(payload)` - HTTP 500 (Internal Server Error)

### Payload Options

All preset functions accept flexible payload formats:

**String shorthand:**

```typescript
ok("Success message");
badRequest("Error message");
// Automatically converts to: { body: { message: "..." } }
```

**Object payload:**

```typescript
ok({ body: { message: "Success", data: {...} }, headers: {...} })
badRequest({ body: { message: "Error", code: "..." }, headers: {...} })
```

**No payload (success only):**

```typescript
ok(); // Returns empty success response
```

Success presets (`ok`, `created`) accept an optional payload. Error presets require a payload (string or object with `body.message`). All object payloads can include an optional `headers` field.

## Type Discrimination

Response objects include a `type` discriminator for type-safe handling:

```typescript
import { ok, badRequest } from "@adobe/aio-commerce-lib-core/responses";

const response =
  Math.random() > 0.5
    ? ok({ body: { message: "Success" } })
    : badRequest({ body: { message: "Error" } });

if (response.type === "success") {
  console.log(`Status: ${response.statusCode}`);
  console.log(`Message: ${response.message}`);
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
  buildSuccessResponse,
  buildErrorResponse,
} from "@adobe/aio-commerce-lib-core/responses";

// 204 No Content
const noContent = buildSuccessResponse(204, {});

// 429 Rate Limited
const rateLimited = buildErrorResponse(429, {
  body: { message: "Too many requests" },
  headers: { "Retry-After": "60" },
});

// 503 Service Unavailable
const unavailable = buildErrorResponse(503, {
  body: {
    message: "Service temporarily unavailable",
    retryAfter: 300,
  },
});
```
