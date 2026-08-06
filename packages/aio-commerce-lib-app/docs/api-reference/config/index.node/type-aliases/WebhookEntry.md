# `WebhookEntry`

```ts
type WebhookEntry = v.InferInput<typeof WebhookEntrySchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:157](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L157)

Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level).
