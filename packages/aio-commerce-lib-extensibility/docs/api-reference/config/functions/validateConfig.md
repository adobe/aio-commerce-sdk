# `validateConfig()`

```ts
function validateConfig(config: unknown): {
  businessConfig?: {
    schema: (
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
        }
    )[];
  };
  metadata: {
    description: string;
    displayName: string;
    id: string;
    version: string;
  };
};
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/validate.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-extensibility/source/config/lib/validate.ts#L58)

Validates a complete extensibility configuration object against the schema.

## Parameters

| Parameter | Type      | Description                           |
| --------- | --------- | ------------------------------------- |
| `config`  | `unknown` | The configuration object to validate. |

## Returns

```ts
{
  businessConfig?: {
     schema: (
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
     })[];
  };
  metadata: {
     description: string;
     displayName: string;
     id: string;
     version: string;
  };
}
```

The validated and typed configuration output model.

### businessConfig?

```ts
optional businessConfig: {
  schema: (
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
  })[];
};
```

#### businessConfig.schema

```ts
schema: (
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
})[];
```

### metadata

```ts
metadata: {
  description: string;
  displayName: string;
  id: string;
  version: string;
} = MetadataSchema;
```

#### metadata.description

```ts
description: string;
```

#### metadata.displayName

```ts
displayName: string;
```

#### metadata.id

```ts
id: string;
```

#### metadata.version

```ts
version: string;
```

## Throws

If the configuration is invalid, with
detailed validation issues included.

## Example

```typescript
const config = {
  businessConfiguration: {
    // ... configuration data
  },
};

try {
  const validatedConfig = validateConfig(config);
  // Use validatedConfig safely
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error("Validation failed:", error.display());
  }
}
```
