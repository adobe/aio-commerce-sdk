# `WebhookEntry`

```ts
type WebhookEntry = v.InferInput<typeof WebhookEntrySchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:157](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L157)

Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level).
