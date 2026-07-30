# `isActionResponse()`

```ts
function isActionResponse(
  response: unknown,
): response is ActionResponse<BodyRecord, BodyRecordWithMessage, HeadersRecord>;
```

Defined in: [responses/helpers.ts:154](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-core/source/responses/helpers.ts#L154)

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
