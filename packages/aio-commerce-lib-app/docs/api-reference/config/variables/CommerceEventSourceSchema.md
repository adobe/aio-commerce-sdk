# `CommerceEventSourceSchema`

```ts
const CommerceEventSourceSchema: ObjectSchema<{
  events: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     destination: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, undefined>;
     fields: ArraySchema<ObjectSchema<{
        name: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>;
        source: OptionalSchema<StringSchema<`Expected a string value for '${(...)}'`>, undefined>;
     }, undefined>, "Expected an array of event field objects with a 'name' property">;
     force: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     hipaa_audit_required: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, RegexAction<string, "Event name must start with \"plugin.\" or \"observer.\" followed by one or more dot-separated lowercase segments containing letters and underscores only (e.g., \"observer.order_placed\", \"plugin.sales.api.order_management.place\")">, MaxLengthAction<string, 180, "The event name must not be longer than 180 characters">]>;
     priority: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     rules: OptionalSchema<ArraySchema<ObjectSchema<{
        field: SchemaWithPipe<readonly [..., ...]>;
        operator: UnionSchema<...[], `Operator must be one of: ${(...)}`>;
        value: SchemaWithPipe<readonly [..., ...]>;
     }, undefined>, "Expected an array of event rules with field, operator, and value">, undefined>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, "Runtime action must be in the format \"<package>/<action>\" (e.g., \"my-package/my-action\")">]>, "Expected an array of runtime actions in the format <package>/<action>">;
  }, undefined>, "Expected an array of Commerce events">;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${(...)}"${(...)}`>]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
  }, undefined>;
}, undefined>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:226](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L226)

Schema for Commerce event source configuration
