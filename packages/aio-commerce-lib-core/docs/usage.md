# `@adobe/aio-commerce-lib-core` Documentation

> [!WARNING]
> This package is still under development and is not yet ready for use. You might be able to install it, but you may encounter breaking changes.

## Overview

This package provides core utilities for the Adobe Commerce SDK libraries:

- **[HTTP Action Router](./guides/http-action-router.md)**: Type-safe HTTP router with schema validation and middleware support
- **[Error Handling](./guides/error-handling.md)**: Custom error classes with enhanced debugging capabilities
- **[Response Helpers](./guides/response-helpers.md)**: Standardized response builders for Adobe I/O Runtime actions
- **[Params Utilities](./guides/params-utilities.md)**: Runtime action parameter validation helpers
- **[Headers Utilities](./guides/headers-utilities.md)**: HTTP header extraction and validation helpers

## API Reference

For a complete list of all available types, functions, and classes, see the [API Reference](./api-reference/README.md).

## Quick Start

### HTTP Action Router

```typescript
import { HttpActionRouter, logger } from "@adobe/aio-commerce-lib-core/actions";
import { ok, created, notFound } from "@adobe/aio-commerce-lib-core/responses";

const router = new HttpActionRouter().use(logger());

router.get("/users/:id", {
  handler: (req, ctx) => {
    ctx.logger.info(`Fetching user ${req.params.id}`);
    return ok({ body: { id: req.params.id } });
  },
});

router.post("/users", {
  handler: (req) => created({ body: req.body }),
});

export const main = router.handler();
```

[Read the HTTP Action Router Guide →](./guides/http-action-router.md)

### Error Handling

```typescript
import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";

class ApiError extends CommerceSdkErrorBase {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message, {});
  }
}

throw new ApiError("Request failed", 500);
```

[Read the Error Handling Guide →](./guides/error-handling.md)

### Response Helpers

```typescript
import { ok, badRequest } from "@adobe/aio-commerce-lib-core/responses";

// Success response using string shorthand
return ok("User retrieved");

// Error response using string shorthand
return badRequest("Invalid input");

// Or use full object syntax for additional data
return ok({ body: { message: "User retrieved", id: "123" } });
```

[Read the Response Helpers Guide →](./guides/response-helpers.md)

### Params Utilities

```typescript
import { allNonEmpty } from "@adobe/aio-commerce-lib-core/params";
import { badRequest } from "@adobe/aio-commerce-lib-core/responses";

function main(params) {
  if (!allNonEmpty(params, ["apiKey", "userId"])) {
    return badRequest({ body: { message: "Missing required parameters" } });
  }

  const { apiKey, userId } = params;
  // Use validated parameters...
}
```

[Read the Params Utilities Guide →](./guides/params-utilities.md)

### Headers Utilities

```typescript
import {
  getHeadersFromParams,
  createHeaderAccessor,
  parseBearerToken,
} from "@adobe/aio-commerce-lib-core/headers";

function main(params) {
  const headers = getHeadersFromParams(params);
  const { xApiKey, authorization } = createHeaderAccessor(headers, [
    "x-api-key",
    "Authorization",
  ]);

  const { token } = parseBearerToken(authorization);
  // Use validated headers and token...
}
```

[Read the Headers Utilities Guide →](./guides/headers-utilities.md)
