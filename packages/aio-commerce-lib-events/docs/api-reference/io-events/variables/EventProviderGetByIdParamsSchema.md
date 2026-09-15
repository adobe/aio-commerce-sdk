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

Defined in: [io-events/api/event-providers/schema.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L43)
