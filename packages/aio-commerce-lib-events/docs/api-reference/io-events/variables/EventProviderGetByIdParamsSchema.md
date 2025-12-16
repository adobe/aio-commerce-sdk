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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-events/source/io-events/api/event-providers/schema.ts#L40)
