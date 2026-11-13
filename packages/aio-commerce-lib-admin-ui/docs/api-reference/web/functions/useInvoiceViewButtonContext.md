# `useInvoiceViewButtonContext()`

```ts
function useInvoiceViewButtonContext(): Result<InvoiceViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:159](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L159)

Returns the invoice ID for an invoice view-button extension point.
Reads `invoiceId` from the page URL search parameters or hash-route query.
Returns an error when the invoice ID is missing or blank.

## Returns

`Result`\<[`InvoiceViewButtonContext`](../type-aliases/InvoiceViewButtonContext.md)\>

## Example

```tsx
const { data, error } = useInvoiceViewButtonContext();
if (error) throw error;
return <span>{data.invoiceId}</span>;
```
