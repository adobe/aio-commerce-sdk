---
title: "DeliveryTypeSchema"
editUrl: false
prev: false
next: false
---

```ts
const DeliveryTypeSchema: PicklistSchema<
  readonly ["webhook", "webhook_batch", "journal", "aws_eventbridge"],
  `Expected delivery type to be one of: ${string}`
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L34)

Schema for delivery type validation.
