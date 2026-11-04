# `UpdateEventMetadataForProviderSchema`

```ts
const UpdateEventMetadataForProviderSchema: ObjectSchema<{
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
}, undefined> = CreateEventMetadataForProviderSchema;
```

Defined in: [io-events/api/event-metadata/schema.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/schema.ts#L100)

The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint.

## See

https://developer.adobe.com/events/docs/api#operation/getByProviderId
