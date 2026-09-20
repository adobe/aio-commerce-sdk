# `useIms()`

```ts
function useIms(): Result<ImsContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx:32](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx#L32)

Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the
Experience Cloud shell.

Returns an error when no host provides credentials.

## Returns

`Result`\<[`ImsContext`](../type-aliases/ImsContext.md)\>
