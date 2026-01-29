# `SubscriberFilterSchema`

```ts
const SubscriberFilterSchema: ObjectSchema<
  {
    description: OptionalSchema<
      SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
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
        StringSchema<`Expected a string value for property '${string}'`>,
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
    subscriberFilter: StringSchema<`Expected a string value for property '${string}'`>;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L69)

Schema for subscriber-defined filter.
