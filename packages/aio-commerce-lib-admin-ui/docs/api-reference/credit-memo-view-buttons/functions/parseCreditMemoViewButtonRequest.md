# `parseCreditMemoViewButtonRequest()`

```ts
function parseCreditMemoViewButtonRequest(input: unknown): {
  creditMemoId: string;
  id: string;
  requestId: string;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/credit-memo-view-buttons/presets.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/credit-memo-view-buttons/presets.ts#L37)

Parses a credit memo view-button worker request.
Throws `CommerceSdkValidationError` when the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  creditMemoId: string;
  id: string;
  requestId: string;
}
```

### creditMemoId

```ts
creditMemoId: string;
```

### id

```ts
id: string;
```

### requestId

```ts
requestId: string;
```

## Example

```ts
const { requestId, id, creditMemoId } =
  parseCreditMemoViewButtonRequest(params);
```
