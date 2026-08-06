# `DeliveryTypeSchema`

```ts
const DeliveryTypeSchema: PicklistSchema<
  readonly ["webhook", "webhook_batch", "journal", "aws_eventbridge"],
  `Expected delivery type to be one of: ${string}`
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L34)

Schema for delivery type validation.
