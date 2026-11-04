# `Menu`

```ts
type Menu = v.InferInput<typeof MenuSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:434](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L434)

Admin UI menu registration configuration.
Includes the optional `aclProtected` flag — when `true`, Commerce auto-generates
a per-app ACL resource from `metadata.id` for role-based menu access control.
