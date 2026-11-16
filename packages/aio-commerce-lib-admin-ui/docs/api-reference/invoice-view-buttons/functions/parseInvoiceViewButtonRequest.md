# `parseInvoiceViewButtonRequest()`

```ts
function parseInvoiceViewButtonRequest(input: unknown): {
  id: string;
  invoiceId: string;
  requestId: string;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/invoice-view-buttons/presets.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/invoice-view-buttons/presets.ts#L37)

Parses an invoice view-button worker request.
Throws `CommerceSdkValidationError` when the input is malformed.

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `input`   | `unknown` |

## Returns

```ts
{
  id: string;
  invoiceId: string;
  requestId: string;
}
```

### id

```ts
id: string;
```

### invoiceId

```ts
invoiceId: string;
```

### requestId

```ts
requestId: string;
```

## Example

```ts
const { requestId, id, invoiceId } = parseInvoiceViewButtonRequest(params);
```
