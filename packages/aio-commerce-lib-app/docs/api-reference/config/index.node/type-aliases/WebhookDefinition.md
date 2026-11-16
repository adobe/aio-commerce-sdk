# `WebhookDefinition`

```ts
type WebhookDefinition =
  | v.InferInput<typeof WebhookDefinitionBaseSchema>
  | v.InferInput<typeof WebhookDefinitionWithUrlSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:166](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L166)

Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape.
