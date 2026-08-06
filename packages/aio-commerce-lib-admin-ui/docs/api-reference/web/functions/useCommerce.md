# `useCommerce()`

```ts
function useCommerce(): Result<CommerceData>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-commerce.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-commerce.ts#L76)

Returns the host (domain) of the Commerce Admin the extension is embedded in, resolving it over
the guest connection.

Returns an error when used outside a Commerce Admin UI frame, when the host does not expose the
Commerce integration API, or when resolving the host fails.

## Returns

`Result`\<`CommerceData`\>
