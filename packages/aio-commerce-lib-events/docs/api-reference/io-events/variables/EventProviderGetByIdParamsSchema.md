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

Defined in: [io-events/api/event-providers/schema.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L43)
