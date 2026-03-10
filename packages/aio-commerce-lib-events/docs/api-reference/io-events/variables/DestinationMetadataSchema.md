# `DestinationMetadataSchema`

```ts
const DestinationMetadataSchema: ObjectSchema<
  {
    awsAccountId: OptionalSchema<
      SchemaWithPipe<
        readonly [
          StringSchema<`Expected a string value for '${string}'`>,
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
          StringSchema<`Expected a string value for '${string}'`>,
          RegexAction<string, "Expected AWS region in format like 'us-east-1'">,
        ]
      >,
      undefined
    >;
  },
  undefined
>;
```

Defined in: [io-events/api/event-registrations/schema.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L46)

Schema for AWS EventBridge destination metadata.
