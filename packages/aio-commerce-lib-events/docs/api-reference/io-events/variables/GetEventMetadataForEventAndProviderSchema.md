# `GetEventMetadataForEventAndProviderSchema`

```ts
const GetEventMetadataForEventAndProviderSchema: ObjectSchema<
  {
    eventCode: StringSchema<`Expected a string value for property '${string}'`>;
    providerId: StringSchema<`Expected a string value for property '${string}'`>;
  },
  undefined
>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L77)

The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
