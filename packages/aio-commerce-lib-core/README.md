# @adobe/aio-commerce-lib-core

A utility library for handling result objects and error management in Adobe Commerce SDKs.

## Installation

```shell
npm install @adobe/aio-commerce-lib-core
```

## Usage

In your App Builder application, you can use the library to bubble up errors and handle results in a consistent way. The reason for this library is to provide a structured way to handle success and failure cases without relying on exceptions, which can lead to cleaner and more maintainable code.

- **Type safety:** Forces you to handle both success and error cases.
- **No exceptions:** Avoids throwing/catching errors for control flow.
- **Clarity:** Makes intent explicit and code easier to follow.

### Result

Within every AppBuilder action you can use the `Result<T, E>` type to handle success and failure cases. The `Result` type is a union type that can either be a success with a value of type `T` or a failure with an error of type `E` that extends `ErrorType`.

#### Signatures

- `isSuccess(result: Result<T, E>): result is { ok: true, value: T }`
- `isFailure(result: Result<T, E>): result is { ok: false, error: E }`
- `getData(result: Result<T, E>): T throws Error`
- `getError(result: Result<T, E>): E throws Error`
- `succeed(value: T): Result<T, E>`
- `fail(error: E): Result<T, E>`

#### Use case

- `isSuccess` and `isFailure` are type guards that let you branch logic based on the result.
- `getData` returns the value if the result is a success, otherwise `undefined`.
- `getError` returns the error if the result is a failure, otherwise `undefined`.
- `succeed` and `fail` are helpers to create success and failure results.

<hr/>

```ts
import {
  type Result,
  getData,
  fail,
  isSuccess,
  succeed,
} from "@adobe/aio-commerce-lib-core/result";

// Simulated function returning a Result
const fetchProduct = async (id: string): Result<Product, Error> => {
  const response = await api.getProductById(id);
  if (response.statusCode === 200) {
    return succeed(response.data);
  }

  return fail({
    _tag: "ApiError",
    error: new Error(response.error),
    statusCode: response.statusCode,
  });
};

export const main = async function (params: Record<string, unknown>) {
  const result = fetchProduct("valid");

  // remaining business logic
};
```

### Result - isSuccess

Here you can use the isFailure TypeGuard to check if the result is a failure, then handle the error by returning an appropriate response. Result is now typesafe, and you can access the value properties directly.

```ts
export const main = async function (params: Record<string, unknown>) {
  // ... [PREVIOUS CODE]
  // Use a the isSuccess TypeGuard to check if the result is a success
  if (isSuccess(result)) {
    // typesafe access to the value properties
    const product = result.value;
    // product: { id: 'valid', name: 'Sample Product' }
    return {
      status: 200,
      body: product,
    };
  }
};
```

### Result - isFailure

In another example you can use the isFailure TypeGuard to check if the result is a failure, then handle the error by returning an appropriate response. Result is now typesafe, and you can access the error properties directly.

```ts
export const main = async function (params: Record<string, unknown>) {
  // Further down within the same action you can
  // use a the isSuccess TypeGuard to check if the result is a success
  if (isFailure(result)) {
    // typesafe access to the error properties
    const error = result.error;
    // error: {
    //   _tag: "ApiError",
    //   error: new Error(response.error),
    //   statusCode: response.statusCode
    // }
    return {
      status: error.statusCode,
      body: {
        error: `CommerceApiError: ${error.error.message}`,
      },
    };
  }
};
```

## Validation

The summarize function helps you pretty-print validation errors for easier debugging.

#### Signature

- `summarize(error: ValidationErrorType): string` -

#### Use case

This prints a readable summary of all validation issues from unknown input data.

<hr/>

```ts
import { summarize } from "@adobe/aio-commerce-lib-core/validation";

const validationErrorType = {
  _tag: "ValidationError",
  message: "Invalid input",
  issues: [...Issues],
};

console.error(summarize(validationErrorType));

// Output:
// Invalid input
// ├──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY"
// ├──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET"
// ├──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN"
// └──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET"
```

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.
