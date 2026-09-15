# `EventSubscriptionUpdateParamsSchema`

```ts
const EventSubscriptionUpdateParamsSchema: ObjectSchema<{
  destination: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  fields: ArraySchema<ObjectSchema<{
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, RegexAction<string, "Field name must contain only letters (a-z, A-Z), numbers (0-9), underscores (_), dashes (-), dots (.), and square brackets ([, ]), or be exactly \"*\"">]>;
     source: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  }, undefined>, `Expected an array of objects with a 'name' property for the property "${string}"`>;
  hipaa_audit_required: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
  name: StringSchema<`Expected a string value for '${string}'`>;
  parent: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  priority: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
  provider_id: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  rules: OptionalSchema<ArraySchema<ObjectSchema<{
     field: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, "Field name must contain only letters (a-z, A-Z), numbers (0-9), underscores (_), dashes (-), dots (.), and square brackets ([, ]), or be exactly \"*\"">]>;
     operator: UnionSchema<LiteralSchema<"regex" | "in" | "greaterThan" | "lessThan" | "equal" | "onChange", undefined>[], `Operator must be one of: ${string}`>;
     value: StringSchema<`Expected a string value for '${string}'`>;
  }, undefined>, `Expected an array of objects with 'field', 'operator', and 'value' properties for the property "${string}"`>, undefined>;
}, undefined>;
```

Defined in: [commerce/api/event-subscriptions/schema.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/schema.ts#L93)
