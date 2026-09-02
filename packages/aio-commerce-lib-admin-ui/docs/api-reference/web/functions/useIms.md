# `useIms()`

```ts
function useIms(): Result<ImsContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx:32](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/web/react/auth/context/ims-context.tsx#L32)

Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the
Experience Cloud shell.

Returns an error when no host provides credentials.

## Returns

`Result`\<[`ImsContext`](../type-aliases/ImsContext.md)\>
