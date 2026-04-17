# `WebhooksConfig`

```ts
type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:158](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L158)

Config type when webhooks are present (non-empty array).

## Type Declaration

### webhooks

```ts
webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
```
