# `WebhookDefinition`

```ts
type WebhookDefinition =
  | v.InferInput<typeof WebhookDefinitionBaseSchema>
  | v.InferInput<typeof WebhookDefinitionWithUrlSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:147](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L147)

Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape.
