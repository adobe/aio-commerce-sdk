# `DeliveryTypeSchema`

```ts
const DeliveryTypeSchema: PicklistSchema<
  readonly ["webhook", "webhook_batch", "journal", "aws_eventbridge"],
  `Expected delivery type to be one of: ${string}`
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L34)

Schema for delivery type validation.
