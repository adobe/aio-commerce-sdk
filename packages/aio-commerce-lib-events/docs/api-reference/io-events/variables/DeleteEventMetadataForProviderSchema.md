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

Defined in: [io-events/api/event-metadata/schema.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L116)

The schema of the parameters received by the DELETE `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
