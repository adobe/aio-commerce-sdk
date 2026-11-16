# `useRmaViewButtonContext()`

```ts
function useRmaViewButtonContext(): Result<RmaViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:207](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L207)

Returns the return (RMA) ID for a return view-button extension point.
Reads `rmaId` from the page URL search parameters or hash-route query.
Returns an error when the return ID is missing or blank.

## Returns

`Result`\<[`RmaViewButtonContext`](../type-aliases/RmaViewButtonContext.md)\>

## Example

```tsx
const { data, error } = useRmaViewButtonContext();
if (error) throw error;
return <span>{data.rmaId}</span>;
```
