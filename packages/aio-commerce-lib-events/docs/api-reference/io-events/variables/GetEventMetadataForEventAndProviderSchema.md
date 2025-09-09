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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts:66](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L66)

The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
