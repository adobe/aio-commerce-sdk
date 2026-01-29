# `DestinationMetadataSchema`

```ts
const DestinationMetadataSchema: ObjectSchema<
  {
    awsAccountId: OptionalSchema<
      SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
          RegexAction<
            string,
            "Expected AWS account ID to be a 12-digit number"
          >,
        ]
      >,
      undefined
    >;
    awsRegion: OptionalSchema<
      SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for property '${string}'`>,
          RegexAction<string, "Expected AWS region in format like 'us-east-1'">,
        ]
      >,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L47)

Schema for AWS EventBridge destination metadata.
