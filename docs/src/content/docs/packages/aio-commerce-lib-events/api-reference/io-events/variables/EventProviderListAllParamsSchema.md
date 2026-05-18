---
title: "EventProviderListAllParamsSchema"
editUrl: false
prev: false
next: false
---

```ts
const EventProviderListAllParamsSchema: ObjectSchema<{
  consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
  filterBy: OptionalSchema<ObjectSchema<{
     instanceId: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
     providerTypes: OptionalSchema<UnionSchema<[ArraySchema<PicklistSchema<readonly [..., ...], undefined>, "Expected an array of event provider types">], undefined>, undefined>;
  }, undefined>, undefined>;
  withEventMetadata: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
}, undefined>;
```

Defined in: [io-events/api/event-providers/schema.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L24)
