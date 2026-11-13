# `useOrderViewButtonContext()`

```ts
function useOrderViewButtonContext(): Result<OrderViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L83)

Returns the context for an order view-button extension point: the order ID the button was
triggered from.

Returns an error when no order ID is present in the page URL.

## Returns

`Result`\<[`OrderViewButtonContext`](../type-aliases/OrderViewButtonContext.md)\>
