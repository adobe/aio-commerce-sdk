# `WebhooksConfig`

```ts
type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:158](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L158)

Config type when webhooks are present (non-empty array).

## Type Declaration

### webhooks

```ts
webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
```
