# `isSuccessResponse()`

```ts
function isSuccessResponse(
  response: unknown,
): response is SuccessResponse<BodyRecord, HeadersRecord>;
```

Defined in: [responses/helpers.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/responses/helpers.ts#L108)

Determines whether a value is a standardized SDK success response.

## Parameters

| Parameter  | Type      | Description       |
| ---------- | --------- | ----------------- |
| `response` | `unknown` | Value to inspect. |

## Returns

`response is SuccessResponse<BodyRecord, HeadersRecord>`

True when the value matches the SDK success response shape.

## Example

```typescript
const result = await runAction(params);
if (isSuccessResponse(result)) {
  console.log(result.statusCode);
}
```
