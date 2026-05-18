---
title: "EventProviderCreateParamsSchema"
editUrl: false
prev: false
next: false
---

```ts
const EventProviderCreateParamsSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
    dataResidencyRegion: OptionalSchema<
      PicklistSchema<readonly ["va6", "irl1"], undefined>,
      undefined
    >;
    description: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    docsUrl: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    instanceId: OptionalSchema<
      StringSchema<`Expected a string value for '${string}'`>,
      undefined
    >;
    label: StringSchema<`Expected a string value for '${string}'`>;
    projectId: StringSchema<`Expected a string value for '${string}'`>;
    providerType: OptionalSchema<
      PicklistSchema<
        readonly ["dx_commerce_events", "3rd_party_custom_events"],
        undefined
      >,
      undefined
    >;
    workspaceId: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-providers/schema.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L48)
