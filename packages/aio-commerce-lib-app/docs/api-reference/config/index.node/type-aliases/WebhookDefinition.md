# `WebhookDefinition`

```ts
type WebhookDefinition =
  | v.InferInput<typeof WebhookDefinitionBaseSchema>
  | v.InferInput<typeof WebhookDefinitionWithUrlSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:152](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L152)

Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape.
