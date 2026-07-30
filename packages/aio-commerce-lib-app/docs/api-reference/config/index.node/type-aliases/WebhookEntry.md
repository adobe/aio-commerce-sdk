# `WebhookEntry`

```ts
type WebhookEntry = v.InferInput<typeof WebhookEntrySchema>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:157](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L157)

Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level).
