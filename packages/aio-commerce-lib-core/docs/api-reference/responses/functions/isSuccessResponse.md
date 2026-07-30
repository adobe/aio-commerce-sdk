# `isSuccessResponse()`

```ts
function isSuccessResponse(
  response: unknown,
): response is SuccessResponse<BodyRecord, HeadersRecord>;
```

Defined in: [responses/helpers.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-core/source/responses/helpers.ts#L108)

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
