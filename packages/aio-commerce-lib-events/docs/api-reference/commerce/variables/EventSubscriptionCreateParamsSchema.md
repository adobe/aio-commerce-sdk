# `EventSubscriptionCreateParamsSchema`

```ts
const EventSubscriptionCreateParamsSchema: ObjectSchema<
  {
    destination: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    fields: ArraySchema<
      ObjectSchema<
        {
          name: StringSchema<`Expected a string value for property '${string}'`>;
        },
        undefined
      >,
      `Expected an array of objects with a 'name' property for the property "${string}"`
    >;
    force: OptionalSchema<
      BooleanSchema<`Expected a boolean value for property '${string}'`>,
      undefined
    >;
    hipaaAuditRequired: OptionalSchema<
      BooleanSchema<`Expected a boolean value for property '${string}'`>,
      undefined
    >;
    name: StringSchema<`Expected a string value for property '${string}'`>;
    parent: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
    prioritary: OptionalSchema<
      BooleanSchema<`Expected a boolean value for property '${string}'`>,
      undefined
    >;
    providerId: OptionalSchema<
      StringSchema<`Expected a string value for property '${string}'`>,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/schema.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/schema.ts#L26)
