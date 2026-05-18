# `CommerceAppConfigSchemas`

```ts
const CommerceAppConfigSchemas: {
  adminUiSdk: ObjectSchema<{
     registration: ObjectSchema<{
        bannerNotification: OptionalSchema<ObjectSchema<{
           massActions: OptionalSchema<ObjectSchema<{
              customer: ...;
              order: ...;
              product: ...;
           }, undefined>, undefined>;
           orderViewButtons: OptionalSchema<ArraySchema<ObjectSchema<..., ...>, undefined>, undefined>;
        }, undefined>, undefined>;
        customer: OptionalSchema<ObjectSchema<{
           gridColumns: OptionalSchema<ObjectSchema<{
              data: ...;
              properties: ...;
           }, undefined>, undefined>;
           massActions: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
        }, undefined>, undefined>;
        menuItems: OptionalSchema<ArraySchema<ObjectSchema<{
           id: SchemaWithPipe<readonly [..., ...]>;
           isSection: OptionalSchema<BooleanSchema<...>, undefined>;
           parent: OptionalSchema<SchemaWithPipe<...>, undefined>;
           sandbox: OptionalSchema<SchemaWithPipe<...>, undefined>;
           sortOrder: OptionalSchema<NumberSchema<...>, undefined>;
           title: OptionalSchema<SchemaWithPipe<...>, undefined>;
        }, undefined>, undefined>, undefined>;
        order: OptionalSchema<ObjectSchema<{
           customFees: OptionalSchema<ArraySchema<ObjectSchema<..., ...>, undefined>, undefined>;
           gridColumns: OptionalSchema<ObjectSchema<{
              data: ...;
              properties: ...;
           }, undefined>, undefined>;
           massActions: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
           viewButtons: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
        }, undefined>, undefined>;
        product: OptionalSchema<ObjectSchema<{
           gridColumns: OptionalSchema<ObjectSchema<{
              data: ...;
              properties: ...;
           }, undefined>, undefined>;
           massActions: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
        }, undefined>, undefined>;
     }, undefined>;
  }, undefined>;
  businessConfig: ObjectSchema<{
     schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [..., ...], undefined>, ObjectSchema<{
        default: ...;
        description: ...;
        env: ...;
        label: ...;
        name: ...;
        type: ...;
      }, undefined>, ObjectSchema<{
        default: ...;
        description: ...;
        env: ...;
        label: ...;
        name: ...;
        type: ...;
      }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
        | {
        default: string;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        options: ...[];
        selectionMode: "single";
        type: "list";
      }
        | {
        default: ...[];
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        options: ...[];
        selectionMode: "multiple";
        type: "list";
      }
        | {
        default: string;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "text";
      }
        | {
        default: "";
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "password";
      }
        | {
        default: string;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "email";
      }
        | {
        default: string;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "url";
      }
        | {
        default: string;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "tel";
      }
        | {
        default: boolean;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "boolean";
     })[], 1, "At least one configuration parameter is required">]>, readonly []>;
  }, undefined>;
  businessConfig.schema: SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<{
     default: SchemaWithPipe<...>;
     description: OptionalSchema<..., ...>;
     env: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     options: ArraySchema<..., ...>;
     selectionMode: LiteralSchema<..., ...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     env: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     options: ArraySchema<..., ...>;
     selectionMode: LiteralSchema<..., ...>;
     type: LiteralSchema<..., ...>;
   }, undefined>], undefined>, ObjectSchema<{
     default: OptionalSchema<StringSchema<"Expected a string for the default value">, "">;
     description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
     env: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
     name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
     type: LiteralSchema<"text", "Expected the type to be 'text'">;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<LiteralSchema<"", "Password fields do not have a default value">, "">;
     description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
     env: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
     name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
     type: LiteralSchema<"password", "Expected the type to be 'password'">;
   }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
     | {
     default: string;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     options: {
        label: string;
        value: string;
     }[];
     selectionMode: "single";
     type: "list";
   }
     | {
     default: string[];
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     options: {
        label: string;
        value: string;
     }[];
     selectionMode: "multiple";
     type: "list";
   }
     | {
     default: string;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     type: "text";
   }
     | {
     default: "";
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     type: "password";
   }
     | {
     default: string;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     type: "email";
   }
     | {
     default: string;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     type: "url";
   }
     | {
     default: string;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     type: "tel";
   }
     | {
     default: boolean;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     type: "boolean";
  })[], 1, "At least one configuration parameter is required">]>;
  eventing: ObjectSchema<{
     commerce: OptionalSchema<ArraySchema<ObjectSchema<{
        events: ArraySchema<ObjectSchema<{
           description: SchemaWithPipe<...>;
           destination: OptionalSchema<..., ...>;
           fields: SchemaWithPipe<...>;
           force: OptionalSchema<..., ...>;
           hipaa_audit_required: OptionalSchema<..., ...>;
           label: SchemaWithPipe<...>;
           name: SchemaWithPipe<...>;
           priority: OptionalSchema<..., ...>;
           rules: OptionalSchema<..., ...>;
           runtimeActions: ArraySchema<..., ...>;
        }, undefined>, "Expected an array of Commerce events">;
        provider: ObjectSchema<{
           description: SchemaWithPipe<readonly [..., ..., ...]>;
           key: OptionalSchema<SchemaWithPipe<...>, undefined>;
           label: SchemaWithPipe<readonly [..., ..., ...]>;
        }, undefined>;
     }, undefined>, "Expected an array of Commerce event sources">, undefined>;
     external: OptionalSchema<ArraySchema<ObjectSchema<{
        events: ArraySchema<ObjectSchema<{
           description: SchemaWithPipe<...>;
           label: SchemaWithPipe<...>;
           name: SchemaWithPipe<...>;
           runtimeActions: ArraySchema<..., ...>;
        }, undefined>, "Expected an array of external events">;
        provider: ObjectSchema<{
           description: SchemaWithPipe<readonly [..., ..., ...]>;
           key: OptionalSchema<SchemaWithPipe<...>, undefined>;
           label: SchemaWithPipe<readonly [..., ..., ...]>;
        }, undefined>;
     }, undefined>, "Expected an array of external event sources">, undefined>;
  }, undefined>;
  eventing.commerce: ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
        destination: OptionalSchema<SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, undefined>;
        fields: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<..., ...>, "Expected an array of event field objects with a 'name' property">, MinLengthAction<...[], 1, "The Commerce event configuration must define at least one field">]>;
        force: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
        hipaa_audit_required: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
        name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must start with \"plugin.\" or \"observer.\" followed by one or more dot-separated lowercase segments containing letters and underscores only (e.g., \"observer.order_placed\", \"plugin.sales.api.order_management.place\")">, MaxLengthAction<string, 180, "The event name must not be longer than 180 characters">]>;
        priority: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
        rules: OptionalSchema<ArraySchema<ObjectSchema<{
           field: ...;
           operator: ...;
           value: ...;
        }, undefined>, "Expected an array of event rules with field, operator, and value">, undefined>;
        runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
     }, undefined>, "Expected an array of Commerce events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
        key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
     }, undefined>;
  }, undefined>, "Expected an array of Commerce event sources">;
  eventing.external: ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
        name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must contain only letters, digits, underscores, hyphens, and dots (e.g., \"external_event\", \"webhook.received\", \"my-event_123\")">, MaxLengthAction<string, 180, "The event name must not be longer than 180 characters">]>;
        runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
     }, undefined>, "Expected an array of external events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
        key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
     }, undefined>;
  }, undefined>, "Expected an array of external event sources">;
  installation: ObjectSchema<{
     customInstallationSteps: SchemaWithPipe<readonly [OptionalSchema<ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [..., ...]>;
        name: SchemaWithPipe<readonly [..., ...]>;
        script: SchemaWithPipe<readonly [..., ...]>;
      }, undefined>, "Expected an array of custom installation steps">, undefined>, CheckAction<
        | {
        description: string;
        name: string;
        script: string;
      }[]
       | undefined, "Duplicate step names detected in custom installation steps. Each step must have a unique name.">]>;
     messages: OptionalSchema<ObjectSchema<{
        postInstallation: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 1000, "The postInstallation message must not be longer than 1000 characters">]>, undefined>;
        preInstallation: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 1000, "The preInstallation message must not be longer than 1000 characters">]>, undefined>;
     }, undefined>, undefined>;
  }, undefined>;
  installation.customInstallationSteps: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 255, "The step description must not be longer than 255 characters">]>;
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 255, "The step name must not be longer than 255 characters">]>;
     script: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, RegexAction<string, "Script path must end with .js (e.g., \"./setup.js\", \"./scripts/setup.js\", or \"../../scripts/setup.js\")">]>;
  }, undefined>, "Expected an array of custom installation steps">;
  metadata: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, MaxLengthAction<string, 255, "The metadata description must not be longer than 255 characters">]>;
     displayName: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, MaxLengthAction<string, 50, "The application display name must not be longer than 50 characters">]>;
     id: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${string}"${string}`>]>, MaxLengthAction<string, 100, "The application id must not be longer than 100 characters">]>;
     version: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, RegexAction<string, "The version must follow semantic versioning (semver) format: Major.Minor.Patch (e.g., '1.0.0', '2.3.1')">]>;
  }, undefined>;
  webhooks: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<UnionSchema<[ObjectSchema<{
     category: OptionalSchema<PicklistSchema<..., ...>, undefined>;
     description: SchemaWithPipe<readonly [..., ...]>;
     label: SchemaWithPipe<readonly [..., ...]>;
     requireAdobeAuth: OptionalSchema<BooleanSchema<...>, undefined>;
     runtimeAction: SchemaWithPipe<readonly [..., ...]>;
     webhook: ObjectSchema<{
        batch_name: ...;
        batch_order: ...;
        fallback_error_message: ...;
        fields: ...;
        headers: ...;
        hook_name: ...;
        method: ...;
        priority: ...;
        required: ...;
        rules: ...;
        soft_timeout: ...;
        timeout: ...;
        ttl: ...;
        webhook_method: ...;
        webhook_type: ...;
     }, undefined>;
   }, undefined>, ObjectSchema<{
     category: OptionalSchema<PicklistSchema<..., ...>, undefined>;
     description: SchemaWithPipe<readonly [..., ...]>;
     label: SchemaWithPipe<readonly [..., ...]>;
     webhook: ObjectSchema<{
        batch_name: ...;
        batch_order: ...;
        fallback_error_message: ...;
        fields: ...;
        headers: ...;
        hook_name: ...;
        method: ...;
        priority: ...;
        required: ...;
        rules: ...;
        soft_timeout: ...;
        timeout: ...;
        ttl: ...;
        url: ...;
        webhook_method: ...;
        webhook_type: ...;
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
        fields?: ...[];
        headers?: ...[];
        hook_name: string;
        method: string;
        priority?: number;
        required?: boolean;
        rules?: ...[];
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
        fields?: ...[];
        headers?: ...[];
        hook_name: string;
        method: string;
        priority?: number;
        required?: boolean;
        rules?: ...[];
        soft_timeout?: number;
        timeout?: number;
        ttl?: number;
        url: string;
        webhook_method: string;
        webhook_type: string;
     };
  })[], 1, "webhooks array must contain at least one webhook when present">]>, undefined>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L37)

The individual validatable domains of the app config.

## Type Declaration

### adminUiSdk

```ts
readonly adminUiSdk: ObjectSchema<{
  registration: ObjectSchema<{
     bannerNotification: OptionalSchema<ObjectSchema<{
        massActions: OptionalSchema<ObjectSchema<{
           customer: ...;
           order: ...;
           product: ...;
        }, undefined>, undefined>;
        orderViewButtons: OptionalSchema<ArraySchema<ObjectSchema<..., ...>, undefined>, undefined>;
     }, undefined>, undefined>;
     customer: OptionalSchema<ObjectSchema<{
        gridColumns: OptionalSchema<ObjectSchema<{
           data: ...;
           properties: ...;
        }, undefined>, undefined>;
        massActions: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
     }, undefined>, undefined>;
     menuItems: OptionalSchema<ArraySchema<ObjectSchema<{
        id: SchemaWithPipe<readonly [..., ...]>;
        isSection: OptionalSchema<BooleanSchema<...>, undefined>;
        parent: OptionalSchema<SchemaWithPipe<...>, undefined>;
        sandbox: OptionalSchema<SchemaWithPipe<...>, undefined>;
        sortOrder: OptionalSchema<NumberSchema<...>, undefined>;
        title: OptionalSchema<SchemaWithPipe<...>, undefined>;
     }, undefined>, undefined>, undefined>;
     order: OptionalSchema<ObjectSchema<{
        customFees: OptionalSchema<ArraySchema<ObjectSchema<..., ...>, undefined>, undefined>;
        gridColumns: OptionalSchema<ObjectSchema<{
           data: ...;
           properties: ...;
        }, undefined>, undefined>;
        massActions: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
        viewButtons: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
     }, undefined>, undefined>;
     product: OptionalSchema<ObjectSchema<{
        gridColumns: OptionalSchema<ObjectSchema<{
           data: ...;
           properties: ...;
        }, undefined>, undefined>;
        massActions: OptionalSchema<ArraySchema<SchemaWithPipe<...>, undefined>, undefined>;
     }, undefined>, undefined>;
  }, undefined>;
}, undefined> = AdminUiSdkSchema;
```

### businessConfig

```ts
readonly businessConfig: ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [..., ...], undefined>, ObjectSchema<{
     default: ...;
     description: ...;
     env: ...;
     label: ...;
     name: ...;
     type: ...;
   }, undefined>, ObjectSchema<{
     default: ...;
     description: ...;
     env: ...;
     label: ...;
     name: ...;
     type: ...;
   }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
     | {
     default: string;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     options: ...[];
     selectionMode: "single";
     type: "list";
   }
     | {
     default: ...[];
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     options: ...[];
     selectionMode: "multiple";
     type: "list";
   }
     | {
     default: string;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "text";
   }
     | {
     default: "";
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "password";
   }
     | {
     default: string;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "email";
   }
     | {
     default: string;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "url";
   }
     | {
     default: string;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "tel";
   }
     | {
     default: boolean;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "boolean";
  })[], 1, "At least one configuration parameter is required">]>, readonly []>;
}, undefined> = SchemaBusinessConfig;
```

#### businessConfig.schema

```ts
readonly businessConfig.schema: SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<{
  default: SchemaWithPipe<...>;
  description: OptionalSchema<..., ...>;
  env: OptionalSchema<..., ...>;
  label: OptionalSchema<..., ...>;
  name: SchemaWithPipe<...>;
  options: ArraySchema<..., ...>;
  selectionMode: LiteralSchema<..., ...>;
  type: LiteralSchema<..., ...>;
}, undefined>, ObjectSchema<{
  default: OptionalSchema<..., ...>;
  description: OptionalSchema<..., ...>;
  env: OptionalSchema<..., ...>;
  label: OptionalSchema<..., ...>;
  name: SchemaWithPipe<...>;
  options: ArraySchema<..., ...>;
  selectionMode: LiteralSchema<..., ...>;
  type: LiteralSchema<..., ...>;
}, undefined>], undefined>, ObjectSchema<{
  default: OptionalSchema<StringSchema<"Expected a string for the default value">, "">;
  description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
  env: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
  label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
  name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  type: LiteralSchema<"text", "Expected the type to be 'text'">;
}, undefined>, ObjectSchema<{
  default: OptionalSchema<LiteralSchema<"", "Password fields do not have a default value">, "">;
  description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
  env: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
  label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
  name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  type: LiteralSchema<"password", "Expected the type to be 'password'">;
}, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
  | {
  default: string;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  options: {
     label: string;
     value: string;
  }[];
  selectionMode: "single";
  type: "list";
}
  | {
  default: string[];
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  options: {
     label: string;
     value: string;
  }[];
  selectionMode: "multiple";
  type: "list";
}
  | {
  default: string;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  type: "text";
}
  | {
  default: "";
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  type: "password";
}
  | {
  default: string;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  type: "email";
}
  | {
  default: string;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  type: "url";
}
  | {
  default: string;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  type: "tel";
}
  | {
  default: boolean;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  type: "boolean";
})[], 1, "At least one configuration parameter is required">]>;
```

### eventing

```ts
readonly eventing: ObjectSchema<{
  commerce: OptionalSchema<ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<...>;
        destination: OptionalSchema<..., ...>;
        fields: SchemaWithPipe<...>;
        force: OptionalSchema<..., ...>;
        hipaa_audit_required: OptionalSchema<..., ...>;
        label: SchemaWithPipe<...>;
        name: SchemaWithPipe<...>;
        priority: OptionalSchema<..., ...>;
        rules: OptionalSchema<..., ...>;
        runtimeActions: ArraySchema<..., ...>;
     }, undefined>, "Expected an array of Commerce events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [..., ..., ...]>;
        key: OptionalSchema<SchemaWithPipe<...>, undefined>;
        label: SchemaWithPipe<readonly [..., ..., ...]>;
     }, undefined>;
  }, undefined>, "Expected an array of Commerce event sources">, undefined>;
  external: OptionalSchema<ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<...>;
        label: SchemaWithPipe<...>;
        name: SchemaWithPipe<...>;
        runtimeActions: ArraySchema<..., ...>;
     }, undefined>, "Expected an array of external events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [..., ..., ...]>;
        key: OptionalSchema<SchemaWithPipe<...>, undefined>;
        label: SchemaWithPipe<readonly [..., ..., ...]>;
     }, undefined>;
  }, undefined>, "Expected an array of external event sources">, undefined>;
}, undefined> = EventingSchema;
```

#### eventing.commerce

```ts
readonly eventing.commerce: ArraySchema<ObjectSchema<{
  events: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     destination: OptionalSchema<SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, undefined>;
     fields: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<..., ...>, "Expected an array of event field objects with a 'name' property">, MinLengthAction<...[], 1, "The Commerce event configuration must define at least one field">]>;
     force: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     hipaa_audit_required: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must start with \"plugin.\" or \"observer.\" followed by one or more dot-separated lowercase segments containing letters and underscores only (e.g., \"observer.order_placed\", \"plugin.sales.api.order_management.place\")">, MaxLengthAction<string, 180, "The event name must not be longer than 180 characters">]>;
     priority: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     rules: OptionalSchema<ArraySchema<ObjectSchema<{
        field: ...;
        operator: ...;
        value: ...;
     }, undefined>, "Expected an array of event rules with field, operator, and value">, undefined>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
  }, undefined>, "Expected an array of Commerce events">;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
  }, undefined>;
}, undefined>, "Expected an array of Commerce event sources">;
```

#### eventing.external

```ts
readonly eventing.external: ArraySchema<ObjectSchema<{
  events: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, `${(...)} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must contain only letters, digits, underscores, hyphens, and dots (e.g., \"external_event\", \"webhook.received\", \"my-event_123\")">, MaxLengthAction<string, 180, "The event name must not be longer than 180 characters">]>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
  }, undefined>, "Expected an array of external events">;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, `${string} can only contain letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /`>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
  }, undefined>;
}, undefined>, "Expected an array of external event sources">;
```

### installation

```ts
readonly installation: ObjectSchema<{
  customInstallationSteps: SchemaWithPipe<readonly [OptionalSchema<ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [..., ...]>;
     name: SchemaWithPipe<readonly [..., ...]>;
     script: SchemaWithPipe<readonly [..., ...]>;
   }, undefined>, "Expected an array of custom installation steps">, undefined>, CheckAction<
     | {
     description: string;
     name: string;
     script: string;
   }[]
    | undefined, "Duplicate step names detected in custom installation steps. Each step must have a unique name.">]>;
  messages: OptionalSchema<ObjectSchema<{
     postInstallation: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 1000, "The postInstallation message must not be longer than 1000 characters">]>, undefined>;
     preInstallation: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 1000, "The preInstallation message must not be longer than 1000 characters">]>, undefined>;
  }, undefined>, undefined>;
}, undefined> = InstallationSchema;
```

#### installation.customInstallationSteps

```ts
readonly installation.customInstallationSteps: ArraySchema<ObjectSchema<{
  description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 255, "The step description must not be longer than 255 characters">]>;
  name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, MaxLengthAction<string, 255, "The step name must not be longer than 255 characters">]>;
  script: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>, RegexAction<string, "Script path must end with .js (e.g., \"./setup.js\", \"./scripts/setup.js\", or \"../../scripts/setup.js\")">]>;
}, undefined>, "Expected an array of custom installation steps">;
```

### metadata

```ts
readonly metadata: ObjectSchema<{
  description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, MaxLengthAction<string, 255, "The metadata description must not be longer than 255 characters">]>;
  displayName: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, MaxLengthAction<string, 50, "The application display name must not be longer than 50 characters">]>;
  id: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${string}"${string}`>]>, MaxLengthAction<string, 100, "The application id must not be longer than 100 characters">]>;
  version: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, RegexAction<string, "The version must follow semantic versioning (semver) format: Major.Minor.Patch (e.g., '1.0.0', '2.3.1')">]>;
}, undefined> = MetadataSchema;
```

### webhooks

```ts
readonly webhooks: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<UnionSchema<[ObjectSchema<{
  category: OptionalSchema<PicklistSchema<..., ...>, undefined>;
  description: SchemaWithPipe<readonly [..., ...]>;
  label: SchemaWithPipe<readonly [..., ...]>;
  requireAdobeAuth: OptionalSchema<BooleanSchema<...>, undefined>;
  runtimeAction: SchemaWithPipe<readonly [..., ...]>;
  webhook: ObjectSchema<{
     batch_name: ...;
     batch_order: ...;
     fallback_error_message: ...;
     fields: ...;
     headers: ...;
     hook_name: ...;
     method: ...;
     priority: ...;
     required: ...;
     rules: ...;
     soft_timeout: ...;
     timeout: ...;
     ttl: ...;
     webhook_method: ...;
     webhook_type: ...;
  }, undefined>;
}, undefined>, ObjectSchema<{
  category: OptionalSchema<PicklistSchema<..., ...>, undefined>;
  description: SchemaWithPipe<readonly [..., ...]>;
  label: SchemaWithPipe<readonly [..., ...]>;
  webhook: ObjectSchema<{
     batch_name: ...;
     batch_order: ...;
     fallback_error_message: ...;
     fields: ...;
     headers: ...;
     hook_name: ...;
     method: ...;
     priority: ...;
     required: ...;
     rules: ...;
     soft_timeout: ...;
     timeout: ...;
     ttl: ...;
     url: ...;
     webhook_method: ...;
     webhook_type: ...;
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
     fields?: ...[];
     headers?: ...[];
     hook_name: string;
     method: string;
     priority?: number;
     required?: boolean;
     rules?: ...[];
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
     fields?: ...[];
     headers?: ...[];
     hook_name: string;
     method: string;
     priority?: number;
     required?: boolean;
     rules?: ...[];
     soft_timeout?: number;
     timeout?: number;
     ttl?: number;
     url: string;
     webhook_method: string;
     webhook_type: string;
  };
})[], 1, "webhooks array must contain at least one webhook when present">]>, undefined> = WebhooksSchema;
```
