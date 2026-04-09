# `EventProviderGetByIdParamsSchema`

```ts
const EventProviderGetByIdParamsSchema: ObjectSchema<
  {
    providerId: StringSchema<`Expected a string value for '${string}'`>;
    withEventMetadata: OptionalSchema<
      BooleanSchema<`Expected a boolean value for '${string}'`>,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [io-events/api/event-providers/schema.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L43)
