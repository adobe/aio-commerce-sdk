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

Defined in: [io-events/api/event-providers/schema.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L43)
