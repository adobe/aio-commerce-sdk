# `EventSubscriptionCreateParamsSchema`

```ts
const EventSubscriptionCreateParamsSchema: ObjectSchema<{
  destination: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  fields: ArraySchema<ObjectSchema<{
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, RegexAction<string, "Field name must contain only letters (a-z, A-Z), numbers (0-9), underscores (_), dashes (-), dots (.), and square brackets ([, ]), or be exactly \"*\"">]>;
     source: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  }, undefined>, `Expected an array of objects with a 'name' property for the property "${string}"`>;
  force: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
  hipaaAuditRequired: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
  name: StringSchema<`Expected a string value for '${string}'`>;
  parent: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  prioritary: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
  providerId: OptionalSchema<StringSchema<`Expected a string value for '${string}'`>, undefined>;
  rules: OptionalSchema<ArraySchema<ObjectSchema<{
     field: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, "Field name must contain only letters (a-z, A-Z), numbers (0-9), underscores (_), dashes (-), dots (.), and square brackets ([, ]), or be exactly \"*\"">]>;
     operator: UnionSchema<LiteralSchema<"regex" | "greaterThan" | "lessThan" | "equal" | "in" | "onChange", undefined>[], `Operator must be one of: ${string}`>;
     value: StringSchema<`Expected a string value for '${string}'`>;
  }, undefined>, `Expected an array of objects with 'field', 'operator', and 'value' properties for the property "${string}"`>, undefined>;
}, undefined>;
```

Defined in: [commerce/api/event-subscriptions/schema.ts:79](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/schema.ts#L79)
