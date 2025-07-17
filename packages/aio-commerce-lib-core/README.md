# `@adobe/aio-commerce-lib-core`

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

This package provides core utilities for the Adobe Commerce SDK libraries.

## Installation

```shell
pnpm install @adobe/aio-commerce-lib-core
```

## Overview

This package provides core utilities for the Adobe Commerce SDK libraries.

### Current Utilities

- **[`Validation`](./source/lib/validation.ts)**: A set of utilities regarding validation, such as creating and pretty-printing validation errors.
- **[`Error`](./source/lib/error.ts)**: Base error classes for the Commerce SDK.

## Usage

### Validation

The `CommerceSdkValidationError` class helps you handle and display validation errors in a user-friendly way.

#### Signature

- `CommerceSdkValidationError(message: string, options: CommerceSdkValidationErrorOptions)` - Creates a validation error.
- `error.display(): string` - Pretty-prints the validation error with all issues.

#### Use case

This provides a structured way to handle validation errors and display them in a readable format.

<hr/>

```ts
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/validation";

// Create a validation error with issues
const validationError = new CommerceSdkValidationError("Invalid input", {
  issues: [
    {
      kind: "validation",
      message: "Expected a non-empty string",
      path: ["clientId"],
    },
    {
      kind: "schema",
      message: "Missing required field",
      path: ["clientSecret"],
    },
  ],
});

// Display the error with pretty formatting
console.error(validationError.display());

// Output:
// Invalid input
// ├── Input error at clientId → Expected a non-empty string
// └── Schema validation error at clientSecret → Missing required field
```

### Error Handling

The library provides base error classes that can be extended for specific error types.

```ts
import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";

// Custom error class
class MyCustomError extends CommerceSdkErrorBase {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

// Usage
try {
  throw new MyCustomError("Something went wrong", "CUSTOM_ERROR");
} catch (error) {
  if (error instanceof MyCustomError) {
    console.error(`Error ${error.code}: ${error.message}`);
  }
}
```

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.
