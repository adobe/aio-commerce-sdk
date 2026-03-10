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

Defined in: [io-events/api/event-metadata/schema.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L76)

The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
