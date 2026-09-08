# `Menu`

```ts
type Menu = v.InferInput<typeof MenuSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:276](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L276)

Admin UI menu registration configuration.
Includes the optional `aclProtected` flag — when `true`, Commerce auto-generates
a per-app ACL resource from `metadata.id` for role-based menu access control.
