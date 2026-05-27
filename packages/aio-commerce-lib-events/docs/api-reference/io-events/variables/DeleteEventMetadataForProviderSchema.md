# `DeleteEventMetadataForProviderSchema`

```ts
const DeleteEventMetadataForProviderSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
    eventCode: StringSchema<`Expected a string value for '${string}'`>;
    projectId: StringSchema<`Expected a string value for '${string}'`>;
    providerId: StringSchema<`Expected a string value for '${string}'`>;
    workspaceId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-metadata/schema.ts:113](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L113)

The schema of the parameters received by the DELETE `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
