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
    rules: OptionalSchema<
      ArraySchema<
        ObjectSchema<
          {
            field: StringSchema<`Expected a string value for property '${string}'`>;
            operator: StringSchema<`Expected a string value for property '${string}'`>;
            value: StringSchema<`Expected a string value for property '${string}'`>;
          },
          undefined
        >,
        `Expected an array of objects with 'field', 'operator', and 'value' properties for the property "${string}"`
      >,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [commerce/api/event-subscriptions/schema.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/schema.ts#L28)

## Notes

- If `rules` is provided, `parent` must also be provided.
