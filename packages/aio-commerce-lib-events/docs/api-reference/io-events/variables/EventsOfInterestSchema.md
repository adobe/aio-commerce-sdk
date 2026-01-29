# `EventsOfInterestSchema`

```ts
const EventsOfInterestSchema: ObjectSchema<
  {
    eventCode: StringSchema<`Expected a string value for property '${string}'`>;
    providerId: StringSchema<`Expected a string value for property '${string}'`>;
    providerMetadataId: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L40)

Schema for events of interest.
