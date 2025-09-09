# `EventProviderListAllParamsSchema`

```ts
const EventProviderListAllParamsSchema: ObjectSchema<{
  consumerOrgId: StringSchema<`Expected a string value for property '${string}'`>;
  filterBy: OptionalSchema<ObjectSchema<{
     instanceId: OptionalSchema<StringSchema<`Expected a string value for property '${string}'`>, undefined>;
     providerTypes: OptionalSchema<UnionSchema<[ArraySchema<PicklistSchema<readonly [..., ...], undefined>, "Expected an array of event provider types">], undefined>, undefined>;
  }, undefined>, undefined>;
  withEventMetadata: OptionalSchema<BooleanSchema<`Expected a boolean value for property '${string}'`>, undefined>;
}, undefined>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/db09d0de34ee085849efca6e0213ea525d0165dc/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L21)
