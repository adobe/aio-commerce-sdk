# `Menu`

```ts
type Menu = v.InferInput<typeof MenuSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:276](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L276)

Admin UI menu registration configuration.
Includes the optional `aclProtected` flag — when `true`, Commerce auto-generates
a per-app ACL resource from `metadata.id` for role-based menu access control.
