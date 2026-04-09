# `WebhooksSchema`

```ts
const WebhooksSchema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<UnionSchema<[ObjectSchema<{
  category: OptionalSchema<PicklistSchema<readonly [..., ..., ...], `Webhook category must be one of: ${(...)}`>, undefined>;
  description: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  label: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  requireAdobeAuth: OptionalSchema<BooleanSchema<`Expected a boolean value for '${(...)}'`>, undefined>;
  runtimeAction: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  webhook: ObjectSchema<{
     batch_name: SchemaWithPipe<...>;
     batch_order: OptionalSchema<..., ...>;
     fallback_error_message: OptionalSchema<..., ...>;
     fields: OptionalSchema<..., ...>;
     headers: OptionalSchema<..., ...>;
     hook_name: SchemaWithPipe<...>;
     method: SchemaWithPipe<...>;
     priority: OptionalSchema<..., ...>;
     required: OptionalSchema<..., ...>;
     rules: OptionalSchema<..., ...>;
     soft_timeout: OptionalSchema<..., ...>;
     timeout: OptionalSchema<..., ...>;
     ttl: OptionalSchema<..., ...>;
     webhook_method: SchemaWithPipe<...>;
     webhook_type: SchemaWithPipe<...>;
  }, undefined>;
}, undefined>, ObjectSchema<{
  category: OptionalSchema<PicklistSchema<readonly [..., ..., ...], `Webhook category must be one of: ${(...)}`>, undefined>;
  description: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  label: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  webhook: ObjectSchema<{
     batch_name: SchemaWithPipe<...>;
     batch_order: OptionalSchema<..., ...>;
     fallback_error_message: OptionalSchema<..., ...>;
     fields: OptionalSchema<..., ...>;
     headers: OptionalSchema<..., ...>;
     hook_name: SchemaWithPipe<...>;
     method: SchemaWithPipe<...>;
     priority: OptionalSchema<..., ...>;
     required: OptionalSchema<..., ...>;
     rules: OptionalSchema<..., ...>;
     soft_timeout: OptionalSchema<..., ...>;
     timeout: OptionalSchema<..., ...>;
     ttl: OptionalSchema<..., ...>;
     url: SchemaWithPipe<...>;
     webhook_method: SchemaWithPipe<...>;
     webhook_type: SchemaWithPipe<...>;
  }, undefined>;
}, undefined>], "Each webhook entry must define either a 'runtimeAction' (to resolve the URL from a runtime action) or an explicit 'url' inside the 'webhook' object, but not both">, "Expected an array of webhook entries">, MinLengthAction<(
  | {
  category?: "validation" | "append" | "modification";
  description: string;
  label: string;
  requireAdobeAuth?: boolean;
  runtimeAction: string;
  webhook: {
     batch_name: string;
     batch_order?: number;
     fallback_error_message?: string;
     fields?: {
        name: ...;
        source?: ...;
     }[];
     headers?: {
        name: ...;
        value: ...;
     }[];
     hook_name: string;
     method: string;
     priority?: number;
     required?: boolean;
     rules?: {
        field: ...;
        operator: ...;
        value: ...;
     }[];
     soft_timeout?: number;
     timeout?: number;
     ttl?: number;
     webhook_method: string;
     webhook_type: string;
  };
}
  | {
  category?: "validation" | "append" | "modification";
  description: string;
  label: string;
  webhook: {
     batch_name: string;
     batch_order?: number;
     fallback_error_message?: string;
     fields?: {
        name: ...;
        source?: ...;
     }[];
     headers?: {
        name: ...;
        value: ...;
     }[];
     hook_name: string;
     method: string;
     priority?: number;
     required?: boolean;
     rules?: {
        field: ...;
        operator: ...;
        value: ...;
     }[];
     soft_timeout?: number;
     timeout?: number;
     ttl?: number;
     url: string;
     webhook_method: string;
     webhook_type: string;
  };
})[], 1, "webhooks array must contain at least one webhook when present">]>, undefined>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:127](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L127)

Schema for the optional webhooks array (when present, must have at least one item).
