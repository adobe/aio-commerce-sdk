# `WebhookEntry`

```ts
type WebhookEntry = v.InferInput<typeof WebhookEntrySchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:171](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L171)

Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level).
