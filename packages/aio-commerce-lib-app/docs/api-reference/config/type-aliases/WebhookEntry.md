# `WebhookEntry`

```ts
type WebhookEntry = v.InferInput<typeof WebhookEntrySchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:152](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L152)

Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level).
