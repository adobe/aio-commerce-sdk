# `ExternalEventSourceSchema`

```ts
const ExternalEventSourceSchema: ObjectSchema<{
  events: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     env: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<..., ...>, NonEmptyAction<..., ...>]>, undefined>;
     hipaa_audit_required: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must contain only letters, digits, underscores, hyphens, and dots (e.g., \"external_event\", \"webhook.received\", \"my-event_123\")">, MaxLengthAction<string, 180, "The event name must not be longer than 180 characters">]>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
   }, undefined>, "Expected an array of external events">, MinLengthAction<{
     description: string;
     env?: ("paas" | "saas")[];
     hipaa_audit_required?: boolean;
     label: string;
     name: string;
     runtimeActions: string[];
   }[], 1, "The external event source configuration must define at least one event">, CheckAction<{
     description: string;
     env?: ("paas" | "saas")[];
     hipaa_audit_required?: boolean;
     label: string;
     name: string;
     runtimeActions: string[];
  }[], "External event names must be unique. There must not be two events with the same name under the same provider.">]>;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${(...)}"${(...)}`>]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
  }, undefined>;
}, undefined>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:269](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L269)

Schema for external event source configuration
