# `CreateEventMetadataForProviderSchema`

```ts
const CreateEventMetadataForProviderSchema: ObjectSchema<{
  consumerOrgId: StringSchema<`Expected a string value for property '${string}'`>;
  description: StringSchema<`Expected a string value for property '${string}'`>;
  eventCode: StringSchema<`Expected a string value for property '${string}'`>;
  label: StringSchema<`Expected a string value for property '${string}'`>;
  projectId: StringSchema<`Expected a string value for property '${string}'`>;
  providerId: StringSchema<`Expected a string value for property '${string}'`>;
  sampleEventTemplate: OptionalSchema<SchemaWithPipe<readonly [UnionSchema<[SchemaWithPipe<readonly [StringSchema<`Expected a string value for property '${(...)}'`>, TransformAction<string, string>, ParseJsonAction<string, undefined, `Expected valid JSON string for property '${(...)}'`>, RecordSchema<StringSchema<...>, UnknownSchema, undefined>]>, RecordSchema<StringSchema<undefined>, UnknownSchema, undefined>, ArraySchema<UnknownSchema, undefined>], undefined>, StringifyJsonAction<
     | unknown[]
     | {
   [key: string]: unknown;
  }, undefined, `Expected valid JSON data for property '${string}'`>, TransformAction<string, string>]>, undefined>;
  workspaceId: StringSchema<`Expected a string value for property '${string}'`>;
}, undefined>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L83)

The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.
