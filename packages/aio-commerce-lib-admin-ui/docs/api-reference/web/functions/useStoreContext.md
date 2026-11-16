# `useStoreContext()`

```ts
function useStoreContext(): Result<StoreContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:129](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L129)

Returns the store identifier from the Commerce shared context as a string.
Numeric identifiers are converted to strings; existing strings retain leading zeros.

Returns an error outside the Commerce shared context or when the store identifier is
missing, null, or not a string or finite number. The customer identifier is not required.

## Returns

`Result`\<[`StoreContext`](../type-aliases/StoreContext.md)\>
