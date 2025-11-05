# Error Handling Guide

The `@adobe/aio-commerce-lib-core/error` module provides custom error classes with enhanced debugging capabilities for consistent error handling across the SDK.

## CommerceSdkErrorBase

Base class for all SDK errors with enhanced debugging capabilities.

### Basic Usage

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

### Error Chaining

Chain errors to preserve context through multiple layers:

```typescript
try {
  await riskyOperation();
} catch (error) {
  throw new MyCustomError("High-level operation failed", {
    cause: error,
  });
}
```

## CommerceSdkValidationError

Specialized error for validation failures with pretty-printing support.

### Basic Usage

```typescript
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParse } from "valibot";

// When validation fails
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

### Working with Validation Errors

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

### 1. Extend Base Error Class for Custom Errors

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

### 2. Use Validation Errors for Schema Validation

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

### 3. Chain Errors Properly

Always use the `cause` option to preserve the error chain:

```typescript
try {
  await riskyOperation();
} catch (error) {
  throw new MyCustomError("High-level operation failed", {
    cause: error,
  });
}
```

This allows you to:

- Trace the full error chain with `error.fullStack`
- Find the original error with `error.rootCause`
- Get a complete JSON representation with `error.toJSON()`
