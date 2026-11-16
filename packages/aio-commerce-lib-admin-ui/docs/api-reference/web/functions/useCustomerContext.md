# `useCustomerContext()`

```ts
function useCustomerContext(): Result<CustomerContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-extension-context.ts#L103)

Returns the customer identifier from the Commerce shared context as a string.
Numeric identifiers are converted to strings; existing strings retain leading zeros.

Returns an error outside the Commerce shared context or when the customer identifier is
missing, null, or not a string or finite number. The store identifier is not required.

## Returns

`Result`\<[`CustomerContext`](../type-aliases/CustomerContext.md)\>
