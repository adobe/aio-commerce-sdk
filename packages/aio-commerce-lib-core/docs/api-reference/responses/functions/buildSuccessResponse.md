# `buildSuccessResponse()`

```ts
function buildSuccessResponse<TBody, THeaders>(
  statusCode: number,
  payload?: {
    body?: TBody;
    headers?: THeaders;
  },
): SuccessResponse<TBody, THeaders>;
```

Defined in: [responses/helpers.ts:243](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/responses/helpers.ts#L243)

Creates a standardized success response for runtime actions

## Type Parameters

| Type Parameter                       | Default type    | Description              |
| ------------------------------------ | --------------- | ------------------------ |
| `TBody` _extends_ `BodyRecord`       | `BodyRecord`    | Response body properties |
| `THeaders` _extends_ `HeadersRecord` | `HeadersRecord` | Custom response headers  |

## Parameters

| Parameter          | Type                                            | Description                                                       |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| `statusCode`       | `number`                                        | HTTP status code (typically 200, 201, 204, etc.)                  |
| `payload?`         | \{ `body?`: `TBody`; `headers?`: `THeaders`; \} | Success response configuration                                    |
| `payload.body?`    | `TBody`                                         | Optional additional response data to include in the response body |
| `payload.headers?` | `THeaders`                                      | Optional custom response headers                                  |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`TBody`, `THeaders`\>

Standardized success response object with type discriminator

## See

https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions#successful-response

## Example

```typescript
// Simple success response
const response = buildSuccessResponse(200, {
  message: "Operation successful",
});

// Success with additional body data
const response = buildSuccessResponse(201, {
  message: "Resource created",
  body: { id: "456", created: true },
  headers: { Location: "/api/resources/456" },
});
```
