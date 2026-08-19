# `DeliveryTypeSchema`

```ts
const DeliveryTypeSchema: PicklistSchema<
  readonly ["webhook", "webhook_batch", "journal", "aws_eventbridge"],
  `Expected delivery type to be one of: ${string}`
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L34)

Schema for delivery type validation.
