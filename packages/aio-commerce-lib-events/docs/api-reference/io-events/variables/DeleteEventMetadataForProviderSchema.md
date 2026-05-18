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

Defined in: [io-events/api/event-metadata/schema.ts:113](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L113)

The schema of the parameters received by the DELETE `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
