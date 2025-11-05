# `@adobe/aio-commerce-lib-core` Documentation

> [!WARNING]
> This package is still under development and is not yet ready for use. You might be able to install it, but you may encounter breaking changes.

## Overview

This package provides core utilities for the Adobe Commerce SDK libraries:

- **[Error Handling](./guides/error-handling.md)**: Custom error classes with enhanced debugging capabilities
- **[Response Helpers](./guides/response-helpers.md)**: Standardized response builders for Adobe I/O Runtime actions
- **[Params Utilities](./guides/params-utilities.md)**: Runtime action parameter validation helpers

## API Reference

For a complete list of all available types, functions, and classes, see the [API Reference](./api-reference/README.md).

## Quick Start

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

// Success response
return ok({ message: "User retrieved", body: { id: "123" } });

// Error response
return badRequest({ message: "Invalid input" });
```

[Read the Response Helpers Guide →](./guides/response-helpers.md)

### Params Utilities

```typescript
import { allNonEmpty } from "@adobe/aio-commerce-lib-core/params";

function main(params) {
  if (!allNonEmpty(params, ["apiKey", "userId"])) {
    return badRequest({ message: "Missing required parameters" });
  }

  const { apiKey, userId } = params;
  // Use validated parameters...
}
```

[Read the Params Utilities Guide →](./guides/params-utilities.md)
