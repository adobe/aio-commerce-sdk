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

Defined in: [io-events/api/event-registrations/schema.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L40)

Schema for events of interest.
