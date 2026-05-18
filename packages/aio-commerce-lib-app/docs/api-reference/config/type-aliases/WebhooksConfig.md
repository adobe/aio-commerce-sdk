# `WebhooksConfig`

```ts
type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:158](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L158)

Config type when webhooks are present (non-empty array).

## Type Declaration

### webhooks

```ts
webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
```
