# `parseRmaViewButtonRequest()`

```ts
function parseRmaViewButtonRequest(input: unknown): {
  id: string;
  requestId: string;
  rmaId: string;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/rma-view-buttons/presets.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/rma-view-buttons/presets.ts#L37)

Parses a return view-button worker request.
Throws `CommerceSdkValidationError` when the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  id: string;
  requestId: string;
  rmaId: string;
}
```

### id

```ts
id: string;
```

### requestId

```ts
requestId: string;
```

### rmaId

```ts
rmaId: string;
```

## Example

```ts
const { requestId, id, rmaId } = parseRmaViewButtonRequest(params);
```
