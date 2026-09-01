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

Defined in: [io-events/api/event-metadata/schema.ts:113](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L113)

The schema of the parameters received by the DELETE `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
