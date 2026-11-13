# `useCommerce()`

```ts
function useCommerce(): Result<CommerceData>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-commerce.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-commerce.ts#L76)

Returns the host (domain) of the Commerce Admin the extension is embedded in, resolving it over
the guest connection.

Returns an error when used outside a Commerce Admin UI frame, when the host does not expose the
Commerce integration API, or when resolving the host fails.

## Returns

`Result`\<`CommerceData`\>
