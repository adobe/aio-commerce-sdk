# `GetEventMetadataForEventAndProviderSchema`

```ts
const GetEventMetadataForEventAndProviderSchema: ObjectSchema<
  {
    eventCode: StringSchema<`Expected a string value for '${string}'`>;
    providerId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-metadata/schema.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L76)

The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
