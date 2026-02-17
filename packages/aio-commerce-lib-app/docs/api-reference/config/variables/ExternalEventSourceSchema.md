# `ExternalEventSourceSchema`

```ts
const ExternalEventSourceSchema: ObjectSchema<{
  events: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, `Only alphanumeric characters and underscores are allowed in string value of "${string}"${string}`>]>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, "Runtime action must be in the format \"<package>/<action>\" (e.g., \"my-package/my-action\")">]>, "Expected an array of runtime actions in the format <package>/<action>">;
  }, undefined>, "Expected an array of external events">;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${(...)}"${(...)}`>]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
  }, undefined>;
}, undefined>;
```

Defined in: [config/schema/eventing.ts:199](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L199)

Schema for external event source configuration
