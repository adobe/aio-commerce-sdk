# `useCreditMemoViewButtonContext()`

```ts
function useCreditMemoViewButtonContext(): Result<CreditMemoViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:183](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L183)

Returns the credit memo ID for a credit memo view-button extension point.
Reads `creditMemoId` from the page URL search parameters or hash-route query.
Returns an error when the credit memo ID is missing or blank.

## Returns

`Result`\<[`CreditMemoViewButtonContext`](../type-aliases/CreditMemoViewButtonContext.md)\>

## Example

```tsx
const { data, error } = useCreditMemoViewButtonContext();
if (error) throw error;
return <span>{data.creditMemoId}</span>;
```
