# `useIms()`

```ts
function useIms(): Result<ImsContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx:32](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx#L32)

Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the
Experience Cloud shell.

Returns an error when no host provides credentials.

## Returns

`Result`\<[`ImsContext`](../type-aliases/ImsContext.md)\>
