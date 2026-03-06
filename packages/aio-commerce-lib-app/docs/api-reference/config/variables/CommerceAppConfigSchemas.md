# `CommerceAppConfigSchemas`

```ts
const CommerceAppConfigSchemas: {
  businessConfig: ObjectSchema<{
     schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [..., ...], undefined>, ObjectSchema<{
        default: ...;
        description: ...;
        label: ...;
        name: ...;
        type: ...;
      }, undefined>, ObjectSchema<{
        default: ...;
        description: ...;
        label: ...;
        name: ...;
        type: ...;
      }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
        | {
        default: string;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        options: ...[];
        selectionMode: "single";
        type: "list";
      }
        | {
        default: ...[];
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        options: ...[];
        selectionMode: "multiple";
        type: "list";
      }
        | {
        default?: ... | ...;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "text";
      }
        | {
        default?: ... | ...;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "password";
      }
        | {
        default?: ... | ...;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "email";
      }
        | {
        default?: ... | ...;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "url";
      }
        | {
        default?: ... | ...;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "tel";
     })[], 1, "At least one configuration parameter is required">]>, readonly []>;
  }, undefined>;
  businessConfig.schema: SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<{
     default: SchemaWithPipe<...>;
     description: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     options: ArraySchema<..., ...>;
     selectionMode: LiteralSchema<..., ...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     options: ArraySchema<..., ...>;
     selectionMode: LiteralSchema<..., ...>;
     type: LiteralSchema<..., ...>;
   }, undefined>], undefined>, ObjectSchema<{
     default: OptionalSchema<StringSchema<"Expected a string for the default value">, undefined>;
     description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
     label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
     name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
     type: LiteralSchema<"text", "Expected the type to be 'text'">;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<StringSchema<"Expected a string for the default value">, undefined>;
     description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
     label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
     name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
     type: LiteralSchema<"password", "Expected the type to be 'password'">;
   }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
     | {
     default: string;
     description?: string;
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
     default?: string;
     description?: string;
     label?: string;
     name: string;
     type: "text";
   }
     | {
     default?: string;
     description?: string;
     label?: string;
     name: string;
     type: "password";
   }
     | {
     default?: string;
     description?: string;
     label?: string;
     name: string;
     type: "email";
   }
     | {
     default?: string;
     description?: string;
     label?: string;
     name: string;
     type: "url";
   }
     | {
     default?: string;
     description?: string;
     label?: string;
     name: string;
     type: "tel";
  })[], 1, "At least one configuration parameter is required">]>;
  eventing: ObjectSchema<{
     commerce: OptionalSchema<ArraySchema<ObjectSchema<{
        events: ArraySchema<ObjectSchema<{
           description: SchemaWithPipe<...>;
           destination: OptionalSchema<..., ...>;
           fields: ArraySchema<..., ...>;
           force: OptionalSchema<..., ...>;
           hipaaAuditRequired: OptionalSchema<..., ...>;
           label: SchemaWithPipe<...>;
           name: SchemaWithPipe<...>;
           prioritary: OptionalSchema<..., ...>;
           rules: OptionalSchema<..., ...>;
           runtimeActions: ArraySchema<..., ...>;
        }, undefined>, "Expected an array of Commerce events">;
        provider: ObjectSchema<{
           description: SchemaWithPipe<readonly [..., ...]>;
           key: OptionalSchema<SchemaWithPipe<...>, undefined>;
           label: SchemaWithPipe<readonly [..., ...]>;
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
           description: SchemaWithPipe<readonly [..., ...]>;
           key: OptionalSchema<SchemaWithPipe<...>, undefined>;
           label: SchemaWithPipe<readonly [..., ...]>;
        }, undefined>;
     }, undefined>, "Expected an array of external event sources">, undefined>;
  }, undefined>;
  eventing.commerce: ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
        destination: OptionalSchema<SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, undefined>;
        fields: ArraySchema<ObjectSchema<{
           name: SchemaWithPipe<...>;
           source: OptionalSchema<..., ...>;
        }, undefined>, "Expected an array of event field objects with a 'name' property">;
        force: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
        hipaaAuditRequired: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
        name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must start with \"plugin.\" or \"observer.\" followed by lowercase letters and underscores only (e.g., \"plugin.order_placed\")">]>;
        prioritary: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
        rules: OptionalSchema<ArraySchema<ObjectSchema<{
           field: ...;
           operator: ...;
           value: ...;
        }, undefined>, "Expected an array of event rules with field, operator, and value">, undefined>;
        runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
     }, undefined>, "Expected an array of Commerce events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
        key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
     }, undefined>;
  }, undefined>, "Expected an array of Commerce event sources">;
  eventing.external: ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
        name: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, RegexAction<string, `Only alphanumeric characters and underscores are allowed in string value of "${(...)}"${(...)}`>]>;
        runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
     }, undefined>, "Expected an array of external events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
        key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
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
     id: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${string}"${string}`>]>;
     version: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, RegexAction<string, "The version must follow semantic versioning (semver) format">]>;
  }, undefined>;
};
```

Defined in: [config/schema/domains.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/schema/domains.ts#L35)

The individual validatable domains of the app config.

## Type Declaration

### businessConfig

```ts
readonly businessConfig: ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [..., ...], undefined>, ObjectSchema<{
     default: ...;
     description: ...;
     label: ...;
     name: ...;
     type: ...;
   }, undefined>, ObjectSchema<{
     default: ...;
     description: ...;
     label: ...;
     name: ...;
     type: ...;
   }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
     | {
     default: string;
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     options: ...[];
     selectionMode: "single";
     type: "list";
   }
     | {
     default: ...[];
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     options: ...[];
     selectionMode: "multiple";
     type: "list";
   }
     | {
     default?: ... | ...;
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "text";
   }
     | {
     default?: ... | ...;
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "password";
   }
     | {
     default?: ... | ...;
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "email";
   }
     | {
     default?: ... | ...;
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "url";
   }
     | {
     default?: ... | ...;
     description?: ... | ...;
     label?: ... | ...;
     name: string;
     type: "tel";
  })[], 1, "At least one configuration parameter is required">]>, readonly []>;
}, undefined> = SchemaBusinessConfig;
```

#### businessConfig.schema

```ts
readonly businessConfig.schema: SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<{
  default: SchemaWithPipe<...>;
  description: OptionalSchema<..., ...>;
  label: OptionalSchema<..., ...>;
  name: SchemaWithPipe<...>;
  options: ArraySchema<..., ...>;
  selectionMode: LiteralSchema<..., ...>;
  type: LiteralSchema<..., ...>;
}, undefined>, ObjectSchema<{
  default: OptionalSchema<..., ...>;
  description: OptionalSchema<..., ...>;
  label: OptionalSchema<..., ...>;
  name: SchemaWithPipe<...>;
  options: ArraySchema<..., ...>;
  selectionMode: LiteralSchema<..., ...>;
  type: LiteralSchema<..., ...>;
}, undefined>], undefined>, ObjectSchema<{
  default: OptionalSchema<StringSchema<"Expected a string for the default value">, undefined>;
  description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
  label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
  name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  type: LiteralSchema<"text", "Expected the type to be 'text'">;
}, undefined>, ObjectSchema<{
  default: OptionalSchema<StringSchema<"Expected a string for the default value">, undefined>;
  description: OptionalSchema<StringSchema<"Expected a string for the field description">, undefined>;
  label: OptionalSchema<StringSchema<"Expected a string for the field label">, undefined>;
  name: SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>;
  type: LiteralSchema<"password", "Expected the type to be 'password'">;
}, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
  | {
  default: string;
  description?: string;
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
  default?: string;
  description?: string;
  label?: string;
  name: string;
  type: "text";
}
  | {
  default?: string;
  description?: string;
  label?: string;
  name: string;
  type: "password";
}
  | {
  default?: string;
  description?: string;
  label?: string;
  name: string;
  type: "email";
}
  | {
  default?: string;
  description?: string;
  label?: string;
  name: string;
  type: "url";
}
  | {
  default?: string;
  description?: string;
  label?: string;
  name: string;
  type: "tel";
})[], 1, "At least one configuration parameter is required">]>;
```

### eventing

```ts
readonly eventing: ObjectSchema<{
  commerce: OptionalSchema<ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<...>;
        destination: OptionalSchema<..., ...>;
        fields: ArraySchema<..., ...>;
        force: OptionalSchema<..., ...>;
        hipaaAuditRequired: OptionalSchema<..., ...>;
        label: SchemaWithPipe<...>;
        name: SchemaWithPipe<...>;
        prioritary: OptionalSchema<..., ...>;
        rules: OptionalSchema<..., ...>;
        runtimeActions: ArraySchema<..., ...>;
     }, undefined>, "Expected an array of Commerce events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [..., ...]>;
        key: OptionalSchema<SchemaWithPipe<...>, undefined>;
        label: SchemaWithPipe<readonly [..., ...]>;
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
        description: SchemaWithPipe<readonly [..., ...]>;
        key: OptionalSchema<SchemaWithPipe<...>, undefined>;
        label: SchemaWithPipe<readonly [..., ...]>;
     }, undefined>;
  }, undefined>, "Expected an array of external event sources">, undefined>;
}, undefined> = EventingSchema;
```

#### eventing.commerce

```ts
readonly eventing.commerce: ArraySchema<ObjectSchema<{
  events: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     destination: OptionalSchema<SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, undefined>;
     fields: ArraySchema<ObjectSchema<{
        name: SchemaWithPipe<...>;
        source: OptionalSchema<..., ...>;
     }, undefined>, "Expected an array of event field objects with a 'name' property">;
     force: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     hipaaAuditRequired: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, RegexAction<string, "Event name must start with \"plugin.\" or \"observer.\" followed by lowercase letters and underscores only (e.g., \"plugin.order_placed\")">]>;
     prioritary: OptionalSchema<BooleanSchema<`Expected a boolean value for '${string}'`>, undefined>;
     rules: OptionalSchema<ArraySchema<ObjectSchema<{
        field: ...;
        operator: ...;
        value: ...;
     }, undefined>, "Expected an array of event rules with field, operator, and value">, undefined>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
  }, undefined>, "Expected an array of Commerce events">;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
  }, undefined>;
}, undefined>, "Expected an array of Commerce event sources">;
```

#### eventing.external

```ts
readonly eventing.external: ArraySchema<ObjectSchema<{
  events: ArraySchema<ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 255, "The event description must not be longer than 255 characters">]>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 100, "The event label must not be longer than 100 characters">]>;
     name: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${(...)}'`>, RegexAction<string, `Only alphanumeric characters and underscores are allowed in string value of "${(...)}"${(...)}`>]>;
     runtimeActions: ArraySchema<SchemaWithPipe<readonly [SchemaWithPipe<...>, RegexAction<..., ...>]>, "Expected an array of runtime actions in the format <package>/<action>">;
  }, undefined>, "Expected an array of external events">;
  provider: ObjectSchema<{
     description: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 255, "The provider description must not be longer than 255 characters">]>;
     key: OptionalSchema<SchemaWithPipe<readonly [SchemaWithPipe<readonly [..., ...]>, MaxLengthAction<string, 50, "The provider key must not be longer than 50 characters">]>, undefined>;
     label: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<...>, NonEmptyAction<..., ...>]>, MaxLengthAction<string, 100, "The provider label must not be longer than 100 characters">]>;
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
  id: SchemaWithPipe<readonly [StringSchema<`Expected a string value for '${string}'`>, RegexAction<string, `Only alphanumeric characters and hyphens are allowed in string value of "${string}"${string}`>]>;
  version: SchemaWithPipe<readonly [SchemaWithPipe<readonly [StringSchema<`Expected a string for the ${string}`>, NonEmptyAction<string, `The ${string} must not be empty`>]>, RegexAction<string, "The version must follow semantic versioning (semver) format">]>;
}, undefined> = MetadataSchema;
```
