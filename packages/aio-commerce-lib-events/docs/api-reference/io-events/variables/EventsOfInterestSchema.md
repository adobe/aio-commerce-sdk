# `EventsOfInterestSchema`

```ts
const EventsOfInterestSchema: ObjectSchema<
  {
    eventCode: StringSchema<`Expected a string value for '${string}'`>;
    providerId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L40)

Schema for events of interest.
