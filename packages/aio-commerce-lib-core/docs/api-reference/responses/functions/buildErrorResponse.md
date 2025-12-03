# `buildErrorResponse()`

```ts
function buildErrorResponse<TBody, THeaders>(
  statusCode: number,
  payload: {
    body: TBody;
    headers?: THeaders;
  },
): ErrorResponse<TBody, THeaders>;
```

Defined in: [responses/helpers.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-core/source/responses/helpers.ts#L101)

Creates a standardized error response for runtime actions

## Type Parameters

| Type Parameter                            | Default type            | Description                                                        |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | Additional error body properties beyond the required message field |
| `THeaders` _extends_ `HeadersRecord`      | `HeadersRecord`         | Custom response headers                                            |

## Parameters

| Parameter          | Type                                           | Description                                                       |
| ------------------ | ---------------------------------------------- | ----------------------------------------------------------------- |
| `statusCode`       | `number`                                       | HTTP status code (e.g., 400, 404, 500)                            |
| `payload`          | \{ `body`: `TBody`; `headers?`: `THeaders`; \} | Error response configuration                                      |
| `payload.body`     | `TBody`                                        | Optional additional error details to include in the response body |
| `payload.headers?` | `THeaders`                                     | Optional custom response headers                                  |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`TBody`, `THeaders`\>

Standardized error response object with type discriminator

## See

https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions#unsuccessful-response

## Example

```typescript
// Simple error with just a message
const error = buildErrorResponse(404, {
  message: "Resource not found",
});

// Error with additional body data
const error = buildErrorResponse(400, {
  message: "Invalid request",
  body: { field: "email", code: "INVALID_FORMAT" },
});

// Error with custom headers
const error = buildErrorResponse(429, {
  message: "Rate limit exceeded",
  headers: { "Retry-After": "60" },
});
```
