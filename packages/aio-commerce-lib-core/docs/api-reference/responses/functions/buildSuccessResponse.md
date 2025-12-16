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

Defined in: [responses/helpers.ts:149](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-core/source/responses/helpers.ts#L149)

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
