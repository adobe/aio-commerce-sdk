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

Defined in: [io-events/api/event-providers/schema.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L24)
