# `useOrderViewButtonContext()`

```ts
function useOrderViewButtonContext(): Result<OrderViewButtonContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L70)

Returns the context for an order view-button extension point: the order ID the button was
triggered from.

Returns an error when no order ID is present in the page URL.

## Returns

`Result`\<[`OrderViewButtonContext`](../type-aliases/OrderViewButtonContext.md)\>
