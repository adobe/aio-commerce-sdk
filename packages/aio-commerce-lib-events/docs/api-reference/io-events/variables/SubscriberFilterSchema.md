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

Defined in: [io-events/api/event-registrations/schema.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L68)

Schema for subscriber-defined filter.
