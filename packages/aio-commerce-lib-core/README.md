# `@adobe/aio-commerce-lib-core`

A utility library for handling result objects and error management in Adobe Commerce SDKs.

## Result Handling

```ts
import {
  Result,
  getData,
  getError,
  isSuccess,
  isFailure,
} from "@adobe/aio-commerce-lib-core";

// Simulated function returning a Result
const fetchProduct = (id: string): Result<Product, Error> => {
  if (id === "valid") {
    return { ok: true, data: { id: "valid", name: "Sample Product" } };
  }
  return { ok: false, error: new Error("Product not found") };
};

const result = fetchProduct("valid");

// Check if the result is a success
if (isSuccess(result)) {
  // Get the data
  const product = getData(result);
  // product: { id: 'valid', name: 'Sample Product' }
}

// Check if the result is a failure
if (isFailure(result)) {
  // Get the error
  const error = getError(result);
  // error: Error('Product not found')
  throw new Error(error.message);
}
```

## Pretty print ValidationErrorType

```ts
import { summarize } from "@adobe/aio-commerce-lib-core/validation";

const validationErrorType = {
  _tag: "ValidationError",
  message: "Invalid input",
  issues: [...Issues],
};

console.error(summarize(validationErrorType));

// Invalid input
// ├──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY"
// ├──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET"
// ├──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN"
// └──  Schema validation error at AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET → Missing or invalid commerce integration parameter "AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET"
```
