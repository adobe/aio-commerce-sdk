# `useIms()`

```ts
function useIms(): Result<ImsContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx:32](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx#L32)

Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the
Experience Cloud shell.

Returns an error when no host provides credentials.

## Returns

`Result`\<[`ImsContext`](../type-aliases/ImsContext.md)\>
