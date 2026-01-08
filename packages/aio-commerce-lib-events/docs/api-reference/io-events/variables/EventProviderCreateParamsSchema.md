# `EventProviderCreateParamsSchema`

```ts
const EventProviderCreateParamsSchema: ObjectSchema<
  {
    consumerOrgId: StringSchema<`Expected a string value for property '${string}'`>;
    dataResidencyRegion: OptionalSchema<
      PicklistSchema<readonly ["va6", "irl1"], undefined>,
      undefined
    >;
    description: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    docsUrl: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    instanceId: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    label: StringSchema<`Expected a string value for property '${string}'`>;
    projectId: StringSchema<`Expected a string value for property '${string}'`>;
    providerType: OptionalSchema<
      PicklistSchema<
        readonly ["dx_commerce_events", "3rd_party_custom_events"],
        undefined
      >,
      undefined
    >;
    workspaceId: StringSchema<`Expected a string value for property '${string}'`>;
  },
  undefined
>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L45)
