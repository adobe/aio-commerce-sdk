# `useOrderViewButtonContext()`

```ts
function useOrderViewButtonContext(): Result<OrderViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L70)

Returns the context for an order view-button extension point: the order ID the button was
triggered from.

Returns an error when no order ID is present in the page URL.

## Returns

`Result`\<[`OrderViewButtonContext`](../type-aliases/OrderViewButtonContext.md)\>
