# `useCommerce()`

```ts
function useCommerce(): Result<CommerceData>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-commerce.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-commerce.ts#L76)

Returns the host (domain) of the Commerce Admin the extension is embedded in, resolving it over
the guest connection.

Returns an error when used outside a Commerce Admin UI frame, when the host does not expose the
Commerce integration API, or when resolving the host fails.

## Returns

`Result`\<`CommerceData`\>
