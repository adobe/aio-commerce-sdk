# `WebhookDefinition`

```ts
type WebhookDefinition =
  | v.InferInput<typeof WebhookDefinitionBaseSchema>
  | v.InferInput<typeof WebhookDefinitionWithUrlSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:152](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L152)

Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape.
