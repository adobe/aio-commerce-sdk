# `isErrorResponse()`

```ts
function isErrorResponse(
  response: unknown,
): response is ErrorResponse<BodyRecordWithMessage, HeadersRecord>;
```

Defined in: [responses/helpers.ts:132](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-core/source/responses/helpers.ts#L132)

Determines whether a value is a standardized SDK error response.

## Parameters

| Parameter  | Type      | Description       |
| ---------- | --------- | ----------------- |
| `response` | `unknown` | Value to inspect. |

## Returns

`response is ErrorResponse<BodyRecordWithMessage, HeadersRecord>`

True when the value matches the SDK error response shape.

## Example

```typescript
const result = await runAction(params);
if (isErrorResponse(result)) {
  console.log(result.error.statusCode);
}
```
