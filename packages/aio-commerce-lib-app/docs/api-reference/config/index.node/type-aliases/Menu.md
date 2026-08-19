# `Menu`

```ts
type Menu = v.InferInput<typeof MenuSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:276](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L276)

Admin UI menu registration configuration.
Includes the optional `aclProtected` flag — when `true`, Commerce auto-generates
a per-app ACL resource from `metadata.id` for role-based menu access control.
