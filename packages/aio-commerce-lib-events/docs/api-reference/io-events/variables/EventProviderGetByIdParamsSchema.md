# `EventProviderGetByIdParamsSchema`

```ts
const EventProviderGetByIdParamsSchema: ObjectSchema<
  {
    providerId: StringSchema<`Expected a string value for property '${string}'`>;
    withEventMetadata: OptionalSchema<
      BooleanSchema<`Expected a boolean value for property '${string}'`>,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L40)
