# `WebhooksConfig`

```ts
type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:158](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L158)

Config type when webhooks are present (non-empty array).

## Type Declaration

### webhooks

```ts
webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
```
