# `CreateRegistrationParamsSchema`

```ts
const CreateRegistrationParamsSchema: ObjectSchema<{
  clientId: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, MinLengthAction<string, 3, "Expected clientId to be at least 1 character">, MaxLengthAction<string, 255, "Expected clientId to be at most 255 characters">]>;
  consumerOrgId: StringSchema<`Expected a string value for '${string}'`>;
  deliveryType: PicklistSchema<readonly ["webhook", "webhook_batch", "journal", "aws_eventbridge"], `Expected delivery type to be one of: ${string}`>;
  description: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, MaxLengthAction<string, 5000, "Expected description to be at most 5000 characters">]>, undefined>;
  destinationMetadata: OptionalSchema<ObjectSchema<{
     awsAccountId: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, "Expected AWS account ID to be a 12-digit number">]>, undefined>;
     awsRegion: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, "Expected AWS region in format like 'us-east-1'">]>, undefined>;
  }, undefined>, undefined>;
  enabled: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
  eventsOfInterest: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     eventCode: StringSchema<`Expected a string value for '${string}'`>;
     providerId: StringSchema<`Expected a string value for '${string}'`>;
   }, undefined>, "Expected eventsOfInterest to be an array of event interest objects">, MinLengthAction<{
     eventCode: string;
     providerId: string;
  }[], 1, "Expected at least one event of interest">]>;
  name: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, MinLengthAction<string, 3, "Expected registration name to be at least 3 characters">, MaxLengthAction<string, 255, "Expected registration name to be at most 255 characters">]>;
  projectId: StringSchema<`Expected a string value for '${string}'`>;
  runtimeAction: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, MaxLengthAction<string, 255, "Expected runtime action to be at most 255 characters">]>, undefined>;
  subscriberFilters: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     description: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     name: SchemaWithPipe<readonly [StringSchema<...>, MinLengthAction<..., ..., ...>, MaxLengthAction<..., ..., ...>]>;
     subscriberFilter: StringSchema<`Expected a string value for '${string}'`>;
   }, undefined>, "Expected subscriberFilters to be an array of subscriber filter objects">, MaxLengthAction<{
     description?: string;
     name: string;
     subscriberFilter: string;
  }[], 1, "Expected at most 1 subscriber filter">]>, undefined>;
  webhookUrl: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, MaxLengthAction<string, 4000, "Expected webhook URL to be at most 4000 characters">]>, undefined>;
  workspaceId: StringSchema<`Expected a string value for '${string}'`>;
}, undefined>;
```

Defined in: [io-events/api/event-registrations/schema.ts:168](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/schema.ts#L168)

Schema for creating a registration.
