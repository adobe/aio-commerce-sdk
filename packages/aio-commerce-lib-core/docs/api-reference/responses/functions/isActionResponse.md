# `isActionResponse()`

```ts
function isActionResponse(
  response: unknown,
): response is ActionResponse<BodyRecord, BodyRecordWithMessage, HeadersRecord>;
```

Defined in: [responses/helpers.ts:154](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/responses/helpers.ts#L154)

Determines whether a value is a standardized SDK action response.

## Parameters

| Parameter  | Type      | Description       |
| ---------- | --------- | ----------------- |
| `response` | `unknown` | Value to inspect. |

## Returns

`response is ActionResponse<BodyRecord, BodyRecordWithMessage, HeadersRecord>`

True when the value matches the SDK action response shape.

## Example

```typescript
const result = await runAction(params);
if (isActionResponse(result) && result.type === "success") {
  console.log(result.statusCode);
}
```
