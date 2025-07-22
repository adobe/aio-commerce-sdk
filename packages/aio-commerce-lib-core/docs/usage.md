# `@adobe/aio-commerce-lib-core` Documentation

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

## Overview

This package provides core utilities for the Adobe Commerce SDK libraries.

- **Error Handling**: Custom error classes with enhanced debugging capabilities

## Reference

This library provides multiple modules for different purposes. For a full list of symbols exported by the library, see the [API Reference](./api-reference/README.md).

### Error Handling (`@adobe/aio-commerce-lib-core/error`)

The library provides custom error classes for consistent error handling across the SDK.

#### CommerceSdkErrorBase

Base class for all SDK errors with enhanced debugging capabilities:

```typescript
import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";

// Create a custom error class
class MyCustomError extends CommerceSdkErrorBase {
  constructor(message: string, options?: { traceId?: string }) {
    super(message, options || {});
  }
}

// Use the error
const error = new MyCustomError("Something went wrong", {
  traceId: "trace-123",
  cause: originalError,
});

// Check if error is an SDK error
if (CommerceSdkErrorBase.isSdkError(error)) {
  console.log(error.fullStack); // Full stack trace including causes
  console.log(error.rootCause); // Get the root cause
  console.log(error.toJSON()); // JSON representation
}
```

#### CommerceSdkValidationError

Specialized error for validation failures with pretty-printing support:

```typescript
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParse } from "valibot";

// When validation fails (`schema` and `data` are in scope somewhere)
const result = safeParse(schema, data);
if (!result.success) {
  const error = new CommerceSdkValidationError("Invalid configuration", {
    issues: result.issues,
  });

  // Pretty-print the validation errors
  console.error(error.display());

  // Output:
  // Invalid configuration
  // ├── Schema validation error at clientId → Expected a non-empty string value
  // ├── Schema validation error at email → Expected a valid email format
  // └── Input error at age → Expected a number greater than 18
}
```

##### Working with Validation Errors

The validation error display shows a tree structure of all validation issues:

```typescript
try {
  // Some validation logic that throws CommerceSdkValidationError
  validateConfig(params);
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error(error.display()); // with colors (default)
    console.error(error.display(false)); // without colors (for logs)

    // Access raw valibot issues
    error.issues.forEach((issue) => {
      console.log(`Issue at ${issue.path}: ${issue.message}`);
    });
  }
}
```

## Best Practices

1. **Extend base error class** for custom errors:

   ```typescript
   class ApiError extends CommerceSdkErrorBase {
     constructor(
       message: string,
       public statusCode: number,
       options?: CommerceSdkErrorBaseOptions,
     ) {
       super(message, options);
     }
   }
   ```

2. **Use validation errors** for anything related to validation:

   ```typescript
   import { safeParse } from "valibot";

   function validateParams(params: unknown) {
     const result = safeParse(schema, params);
     if (!result.success) {
       throw new CommerceSdkValidationError("Invalid parameters", {
         issues: result.issues,
       });
     }
     return result.output;
   }
   ```

3. **Chain errors properly** using the `cause` option:
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     throw new MyCustomError("High-level operation failed", {
       cause: error,
     });
   }
   ```
