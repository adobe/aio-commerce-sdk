# `CommerceAppConfigSchemas`

```ts
const CommerceAppConfigSchemas: {
  adminUi: ObjectSchema<{
     customer: OptionalSchema<ObjectSchema<{
        gridColumns: OptionalSchema<ObjectSchema<{
           columns: SchemaWithPipe<readonly [..., ...]>;
           description: SchemaWithPipe<readonly [..., ...]>;
           label: SchemaWithPipe<readonly [..., ...]>;
           runtimeAction: SchemaWithPipe<readonly [..., ...]>;
        }, undefined>, undefined>;
        massActions: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], "mass action \"type\" must be either \"view\" or \"worker\"">, undefined>, undefined>;
     }, undefined>, undefined>;
     menu: OptionalSchema<ObjectSchema<{
        aclProtected: OptionalSchema<BooleanSchema<undefined>, undefined>;
        description: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>;
        id: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, "Menu ID may contain only letters, digits, \"/\", \":\", and \"_\"">]>;
        label: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>;
        pageTitle: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, undefined>;
        parentMenu: OptionalSchema<PicklistSchema<readonly ["sales", "catalog", "customers", "marketing", "content", "reports", "stores", "system"], "parentMenu must be a known Commerce Admin menu ID">, undefined>;
        sandboxPermissions: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<PicklistSchema<..., ...>, undefined>, MinLengthAction<...[], 1, "sandboxPermissions must contain at least one permission when it's defined">, CheckAction<...[], "Duplicate permissions are not allowed in sandboxPermissions">]>, undefined>;
     }, undefined>, undefined>;
     order: OptionalSchema<ObjectSchema<{
        gridColumns: OptionalSchema<ObjectSchema<{
           columns: SchemaWithPipe<readonly [..., ...]>;
           description: SchemaWithPipe<readonly [..., ...]>;
           label: SchemaWithPipe<readonly [..., ...]>;
           runtimeAction: SchemaWithPipe<readonly [..., ...]>;
        }, undefined>, undefined>;
        massActions: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], "mass action \"type\" must be either \"view\" or \"worker\"">, undefined>, undefined>;
        viewButtons: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], undefined>, undefined>, undefined>;
     }, undefined>, undefined>;
     product: OptionalSchema<ObjectSchema<{
        gridColumns: OptionalSchema<ObjectSchema<{
           columns: SchemaWithPipe<readonly [..., ...]>;
           description: SchemaWithPipe<readonly [..., ...]>;
           label: SchemaWithPipe<readonly [..., ...]>;
           runtimeAction: SchemaWithPipe<readonly [..., ...]>;
        }, undefined>, undefined>;
        massActions: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], "mass action \"type\" must be either \"view\" or \"worker\"">, undefined>, undefined>;
     }, undefined>, undefined>;
  }, undefined>;
  businessConfig: ObjectSchema<{
     schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [..., ...], undefined>, VariantSchema<"selectionMode", [..., ...], undefined>, ObjectSchema<{
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
        default: SingleDefaultFactory;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        options: OptionsFactory;
        selectionMode: "single";
        type: "dynamicList";
      }
        | {
        default?: ... | ...;
        description?: ... | ...;
        env?: ... | ...;
        label?: ... | ...;
        name: string;
        options: OptionsFactory;
        selectionMode: "multiple";
        type: "dynamicList";
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
   }, undefined>], undefined>, VariantSchema<"selectionMode", [ObjectSchema<{
     default: CustomSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     env: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     options: CustomSchema<..., ...>;
     selectionMode: LiteralSchema<..., ...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     env: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     options: CustomSchema<..., ...>;
     selectionMode: LiteralSchema<..., ...>;
     type: LiteralSchema<..., ...>;
   }, undefined>], undefined>, ObjectSchema<{
     default: OptionalSchema<StringSchema<"Expected a string for the default value">, "">;
     description: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     env: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
     name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
     type: LiteralSchema<"text", "Expected the type to be 'text'">;
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
     default: SingleDefaultFactory;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     options: OptionsFactory;
     selectionMode: "single";
     type: "dynamicList";
   }
     | {
     default?: MultipleDefaultFactory;
     description?: string;
     env?: ("paas" | "saas")[];
     label?: string;
     name: string;
     options: OptionsFactory;
     selectionMode: "multiple";
     type: "dynamicList";
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
     commerce: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
        events: SchemaWithPipe<readonly [..., ..., ...]>;
        provider: ObjectSchema<{
           description: ...;
           key: ...;
           label: ...;
        }, undefined>;
      }, undefined>, "Expected an array of Commerce event sources">, CheckAction<{
        events: {
           description: ...;
           destination?: ...;
           env?: ...;
           fields: ...;
           force?: ...;
           hipaa_audit_required?: ...;
           label: ...;
           name: ...;
           priority?: ...;
           rules?: ...;
           runtimeActions: ...;
        }[];
        provider: {
           description: string;
           key?: ... | ...;
           label: string;
        };
     }[], "Commerce provider labels must be unique">]>, undefined>;
     external: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
        events: SchemaWithPipe<readonly [..., ..., ...]>;
        provider: ObjectSchema<{
           description: ...;
           key: ...;
           label: ...;
        }, undefined>;
      }, undefined>, "Expected an array of external event sources">, CheckAction<{
        events: {
           description: ...;
           env?: ...;
           hipaa_audit_required?: ...;
           label: ...;
           name: ...;
           runtimeActions: ...;
        }[];
        provider: {
           description: string;
           key?: ... | ...;
           label: string;
        };
     }[], "External provider labels must be unique">]>, undefined>;
  }, undefined>;
  eventing.commerce: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
        description: ...;
        destination: ...;
        env: ...;
        fields: ...;
        force: ...;
        hipaa_audit_required: ...;
        label: ...;
        name: ...;
        priority: ...;
        rules: ...;
        runtimeActions: ...;
      }, undefined>, "Expected an array of Commerce events">, MinLengthAction<{
        description: ...;
        destination?: ...;
        env?: ...;
        fields: ...;
        force?: ...;
        hipaa_audit_required?: ...;
        label: ...;
        name: ...;
        priority?: ...;
        rules?: ...;
        runtimeActions: ...;
      }[], 1, "The Commerce event source configuration must define at least one event">, CheckAction<{
        description: ...;
        destination?: ...;
        env?: ...;
        fields: ...;
        force?: ...;
        hipaa_audit_required?: ...;
        label: ...;
        name: ...;
        priority?: ...;
        rules?: ...;
        runtimeActions: ...;
     }[], "Commerce event names must be unique. There must not be two events with the same name under the same provider.">]>;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
        key: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
     }, undefined>;
   }, undefined>, "Expected an array of Commerce event sources">, CheckAction<{
     events: {
        description: string;
        destination?: string;
        env?: (... | ...)[];
        fields: {
           name: string;
           source?: ... | ...;
        }[];
        force?: boolean;
        hipaa_audit_required?: boolean;
        label: string;
        name: string;
        priority?: boolean;
        rules?: {
           field: ...;
           operator: ...;
           value: ...;
        }[];
        runtimeActions: string[];
     }[];
     provider: {
        description: string;
        key?: string;
        label: string;
     };
  }[], "Commerce provider labels must be unique">]>;
  eventing.external: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
        description: ...;
        env: ...;
        hipaa_audit_required: ...;
        label: ...;
        name: ...;
        runtimeActions: ...;
      }, undefined>, "Expected an array of external events">, MinLengthAction<{
        description: ...;
        env?: ...;
        hipaa_audit_required?: ...;
        label: ...;
        name: ...;
        runtimeActions: ...;
      }[], 1, "The external event source configuration must define at least one event">, CheckAction<{
        description: ...;
        env?: ...;
        hipaa_audit_required?: ...;
        label: ...;
        name: ...;
        runtimeActions: ...;
     }[], "External event names must be unique. There must not be two events with the same name under the same provider.">]>;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
        key: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
     }, undefined>;
   }, undefined>, "Expected an array of external event sources">, CheckAction<{
     events: {
        description: string;
        env?: (... | ...)[];
        hipaa_audit_required?: boolean;
        label: string;
        name: string;
        runtimeActions: string[];
     }[];
     provider: {
        description: string;
        key?: string;
        label: string;
     };
  }[], "External provider labels must be unique">]>;
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
     env: OptionalSchema<SchemaWithPipe<...>, undefined>;
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
     env: OptionalSchema<SchemaWithPipe<...>, undefined>;
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
     env?: (... | ...)[];
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
     env?: (... | ...)[];
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

Defined in: [aio-commerce-lib-app/source/config/schema/domains.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L37)

The individual validatable domains of the app config.

## Type Declaration

### adminUi

```ts
readonly adminUi: ObjectSchema<{
  customer: OptionalSchema<ObjectSchema<{
     gridColumns: OptionalSchema<ObjectSchema<{
        columns: SchemaWithPipe<readonly [..., ...]>;
        description: SchemaWithPipe<readonly [..., ...]>;
        label: SchemaWithPipe<readonly [..., ...]>;
        runtimeAction: SchemaWithPipe<readonly [..., ...]>;
     }, undefined>, undefined>;
     massActions: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], "mass action \"type\" must be either \"view\" or \"worker\"">, undefined>, undefined>;
  }, undefined>, undefined>;
  menu: OptionalSchema<ObjectSchema<{
     aclProtected: OptionalSchema<BooleanSchema<undefined>, undefined>;
     description: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>;
     id: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, RegexAction<string, "Menu ID may contain only letters, digits, \"/\", \":\", and \"_\"">]>;
     label: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, NonEmptyAction<string, `The value of "${string}" must not be empty`>]>;
     pageTitle: OptionalSchema<SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, NonEmptyAction<string, `The value of "${(...)}" must not be empty`>]>, undefined>;
     parentMenu: OptionalSchema<PicklistSchema<readonly ["sales", "catalog", "customers", "marketing", "content", "reports", "stores", "system"], "parentMenu must be a known Commerce Admin menu ID">, undefined>;
     sandboxPermissions: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<PicklistSchema<..., ...>, undefined>, MinLengthAction<...[], 1, "sandboxPermissions must contain at least one permission when it's defined">, CheckAction<...[], "Duplicate permissions are not allowed in sandboxPermissions">]>, undefined>;
  }, undefined>, undefined>;
  order: OptionalSchema<ObjectSchema<{
     gridColumns: OptionalSchema<ObjectSchema<{
        columns: SchemaWithPipe<readonly [..., ...]>;
        description: SchemaWithPipe<readonly [..., ...]>;
        label: SchemaWithPipe<readonly [..., ...]>;
        runtimeAction: SchemaWithPipe<readonly [..., ...]>;
     }, undefined>, undefined>;
     massActions: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], "mass action \"type\" must be either \"view\" or \"worker\"">, undefined>, undefined>;
     viewButtons: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], undefined>, undefined>, undefined>;
  }, undefined>, undefined>;
  product: OptionalSchema<ObjectSchema<{
     gridColumns: OptionalSchema<ObjectSchema<{
        columns: SchemaWithPipe<readonly [..., ...]>;
        description: SchemaWithPipe<readonly [..., ...]>;
        label: SchemaWithPipe<readonly [..., ...]>;
        runtimeAction: SchemaWithPipe<readonly [..., ...]>;
     }, undefined>, undefined>;
     massActions: OptionalSchema<ArraySchema<VariantSchema<"type", [StrictObjectSchema<..., ...>, StrictObjectSchema<..., ...>], "mass action \"type\" must be either \"view\" or \"worker\"">, undefined>, undefined>;
  }, undefined>, undefined>;
}, undefined> = AdminUiSchema;
```

### businessConfig

```ts
readonly businessConfig: ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [..., ...], undefined>, VariantSchema<"selectionMode", [..., ...], undefined>, ObjectSchema<{
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
     default: SingleDefaultFactory;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     options: OptionsFactory;
     selectionMode: "single";
     type: "dynamicList";
   }
     | {
     default?: ... | ...;
     description?: ... | ...;
     env?: ... | ...;
     label?: ... | ...;
     name: string;
     options: OptionsFactory;
     selectionMode: "multiple";
     type: "dynamicList";
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
}, undefined>], undefined>, VariantSchema<"selectionMode", [ObjectSchema<{
  default: CustomSchema<..., ...>;
  description: OptionalSchema<..., ...>;
  env: OptionalSchema<..., ...>;
  label: OptionalSchema<..., ...>;
  name: SchemaWithPipe<...>;
  options: CustomSchema<..., ...>;
  selectionMode: LiteralSchema<..., ...>;
  type: LiteralSchema<..., ...>;
}, undefined>, ObjectSchema<{
  default: OptionalSchema<..., ...>;
  description: OptionalSchema<..., ...>;
  env: OptionalSchema<..., ...>;
  label: OptionalSchema<..., ...>;
  name: SchemaWithPipe<...>;
  options: CustomSchema<..., ...>;
  selectionMode: LiteralSchema<..., ...>;
  type: LiteralSchema<..., ...>;
}, undefined>], undefined>, ObjectSchema<{
  default: OptionalSchema<StringSchema<"Expected a string for the default value">, "">;
  description: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
  env: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
  label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
  name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  type: LiteralSchema<"text", "Expected the type to be 'text'">;
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
  default: SingleDefaultFactory;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  options: OptionsFactory;
  selectionMode: "single";
  type: "dynamicList";
}
  | {
  default?: MultipleDefaultFactory;
  description?: string;
  env?: ("paas" | "saas")[];
  label?: string;
  name: string;
  options: OptionsFactory;
  selectionMode: "multiple";
  type: "dynamicList";
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
  commerce: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: SchemaWithPipe<readonly [..., ..., ...]>;
     provider: ObjectSchema<{
        description: ...;
        key: ...;
        label: ...;
     }, undefined>;
   }, undefined>, "Expected an array of Commerce event sources">, CheckAction<{
     events: {
        description: ...;
        destination?: ...;
        env?: ...;
        fields: ...;
        force?: ...;
        hipaa_audit_required?: ...;
        label: ...;
        name: ...;
        priority?: ...;
        rules?: ...;
        runtimeActions: ...;
     }[];
     provider: {
        description: string;
        key?: ... | ...;
        label: string;
     };
  }[], "Commerce provider labels must be unique">]>, undefined>;
  external: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: SchemaWithPipe<readonly [..., ..., ...]>;
     provider: ObjectSchema<{
        description: ...;
        key: ...;
        label: ...;
     }, undefined>;
   }, undefined>, "Expected an array of external event sources">, CheckAction<{
     events: {
        description: ...;
        env?: ...;
        hipaa_audit_required?: ...;
        label: ...;
        name: ...;
        runtimeActions: ...;
     }[];
     provider: {
        description: string;
        key?: ... | ...;
        label: string;
     };
  }[], "External provider labels must be unique">]>, undefined>;
}, undefined> = EventingSchema;
```

#### eventing.commerce

```ts
readonly eventing.commerce: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
  events: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     description: ...;
     destination: ...;
     env: ...;
     fields: ...;
     force: ...;
     hipaa_audit_required: ...;
     label: ...;
     name: ...;
     priority: ...;
     rules: ...;
     runtimeActions: ...;
   }, undefined>, "Expected an array of Commerce events">, MinLengthAction<{
     description: ...;
     destination?: ...;
     env?: ...;
     fields: ...;
     force?: ...;
     hipaa_audit_required?: ...;
     label: ...;
     name: ...;
     priority?: ...;
     rules?: ...;
     runtimeActions: ...;
   }[], 1, "The Commerce event source configuration must define at least one event">, CheckAction<{
     description: ...;
     destination?: ...;
     env?: ...;
     fields: ...;
     force?: ...;
     hipaa_audit_required?: ...;
     label: ...;
     name: ...;
     priority?: ...;
     rules?: ...;
     runtimeActions: ...;
  }[], "Commerce event names must be unique. There must not be two events with the same name under the same provider.">]>;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
     key: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
  }, undefined>;
}, undefined>, "Expected an array of Commerce event sources">, CheckAction<{
  events: {
     description: string;
     destination?: string;
     env?: (... | ...)[];
     fields: {
        name: string;
        source?: ... | ...;
     }[];
     force?: boolean;
     hipaa_audit_required?: boolean;
     label: string;
     name: string;
     priority?: boolean;
     rules?: {
        field: ...;
        operator: ...;
        value: ...;
     }[];
     runtimeActions: string[];
  }[];
  provider: {
     description: string;
     key?: string;
     label: string;
  };
}[], "Commerce provider labels must be unique">]>;
```

#### eventing.external

```ts
readonly eventing.external: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
  events: SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     description: ...;
     env: ...;
     hipaa_audit_required: ...;
     label: ...;
     name: ...;
     runtimeActions: ...;
   }, undefined>, "Expected an array of external events">, MinLengthAction<{
     description: ...;
     env?: ...;
     hipaa_audit_required?: ...;
     label: ...;
     name: ...;
     runtimeActions: ...;
   }[], 1, "The external event source configuration must define at least one event">, CheckAction<{
     description: ...;
     env?: ...;
     hipaa_audit_required?: ...;
     label: ...;
     name: ...;
     runtimeActions: ...;
  }[], "External event names must be unique. There must not be two events with the same name under the same provider.">]>;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
     key: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>, MaxLengthAction<..., ..., ...>]>;
  }, undefined>;
}, undefined>, "Expected an array of external event sources">, CheckAction<{
  events: {
     description: string;
     env?: (... | ...)[];
     hipaa_audit_required?: boolean;
     label: string;
     name: string;
     runtimeActions: string[];
  }[];
  provider: {
     description: string;
     key?: string;
     label: string;
  };
}[], "External provider labels must be unique">]>;
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
  env: OptionalSchema<SchemaWithPipe<...>, undefined>;
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
  env: OptionalSchema<SchemaWithPipe<...>, undefined>;
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
  env?: (... | ...)[];
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
  env?: (... | ...)[];
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
