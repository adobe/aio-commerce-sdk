# `EventProviderCreateParamsSchema`

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

Defined in: [io-events/api/event-providers/schema.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L48)
