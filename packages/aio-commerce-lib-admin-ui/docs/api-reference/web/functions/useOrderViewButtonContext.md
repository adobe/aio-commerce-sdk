# `useOrderViewButtonContext()`

```ts
function useOrderViewButtonContext(): Result<OrderViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L70)

Returns the context for an order view-button extension point: the order ID the button was
triggered from.

Returns an error when no order ID is present in the page URL.

## Returns

`Result`\<[`OrderViewButtonContext`](../type-aliases/OrderViewButtonContext.md)\>
