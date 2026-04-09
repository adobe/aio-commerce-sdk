# `SubscriberFilterSchema`

```ts
const SubscriberFilterSchema: ObjectSchema<
  {
    description: OptionalSchema<
      SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
          MaxLengthAction<
            string,
            250,
            "Expected subscriber filter description to be at most 250 characters"
          >,
        ]
      >,
      undefined
    >;
    name: SchemaWithPipe<
      readonly [
        StringSchema<`Expected a string value for '${string}'`>,
        MinLengthAction<
          string,
          3,
          "Expected subscriber filter name to be at least 3 characters"
        >,
        MaxLengthAction<
          string,
          80,
          "Expected subscriber filter name to be at most 80 characters"
        >,
      ]
    >;
    subscriberFilter: StringSchema<`Expected a string value for '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L68)

Schema for subscriber-defined filter.
