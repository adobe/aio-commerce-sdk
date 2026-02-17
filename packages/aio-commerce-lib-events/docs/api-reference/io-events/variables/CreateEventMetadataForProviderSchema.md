# `CreateEventMetadataForProviderSchema`

```ts
const CreateEventMetadataForProviderSchema: ObjectSchema<{
  consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
  description: StringSchema<`Expected a string value for '${string}'`>;
  eventCode: StringSchema<`Expected a string value for '${string}'`>;
  label: StringSchema<`Expected a string value for '${string}'`>;
  projectId: StringSchema<`Expected a string value for '${string}'`>;
  providerId: StringSchema<`Expected a string value for '${string}'`>;
  sampleEventTemplate: OptionalSchema<SchemaWithPipe<readonly [UnionSchema<[SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, TransformAction<string, string>, ParseJsonAction<string, undefined, `Expected valid JSON string for property '${(...)}'`>, RecordSchema<StringSchema<...>, UnknownSchema, undefined>]>, RecordSchema<StringSchema<undefined>, UnknownSchema, undefined>, ArraySchema<UnknownSchema, undefined>], undefined>, StringifyJsonAction<
     | {
   [key: string]: unknown;
   }
    | unknown[], undefined, `Expected valid JSON data for property '${string}'`>, TransformAction<string, string>]>, undefined>;
  workspaceId: StringSchema<`Expected a string value for '${string}'`>;
}, undefined>;
```

Defined in: [io-events/api/event-metadata/schema.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L82)

The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.
