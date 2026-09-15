# `Menu`

```ts
type Menu = v.InferInput<typeof MenuSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:411](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L411)

Admin UI menu registration configuration.
Includes the optional `aclProtected` flag — when `true`, Commerce auto-generates
a per-app ACL resource from `metadata.id` for role-based menu access control.
