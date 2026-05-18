---
title: "WebhookDefinition"
editUrl: false
prev: false
next: false
---

```ts
type WebhookDefinition =
  | v.InferInput<typeof WebhookDefinitionBaseSchema>
  | v.InferInput<typeof WebhookDefinitionWithUrlSchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:147](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L147)

Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape.
