# `defineConfig()`

```ts
function defineConfig(config: {
  businessConfig?: {
    schema?: (
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
          default?: string[];
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
}): {
  businessConfig?: {
    schema?: (
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
          default?: string[];
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

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/define.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-extensibility/source/config/lib/define.ts#L29)

Helper to type-safely define the extensibility config.

## Parameters

| Parameter                       | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Description                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `config`                        | \{ `businessConfig?`: \{ `schema?`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; \} | The extensibility config to define. |
| `config.businessConfig?`        | \{ `schema?`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}                                                                                                                                     | -                                   |
| `config.businessConfig.schema?` | ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]                                                                                                                                                       | -                                   |
| `config.metadata`               | \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | -                                   |
| `config.metadata.description`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | -                                   |
| `config.metadata.displayName`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | -                                   |
| `config.metadata.id`            | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | -                                   |
| `config.metadata.version`       | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | -                                   |

## Returns

```ts
{
  businessConfig?: {
     schema?: (
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
        default?: string[];
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

### businessConfig?

```ts
optional businessConfig: {
  schema?: (
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
     default?: string[];
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

#### businessConfig.schema?

```ts
optional schema: (
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
  default?: string[];
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

## Example

```typescript
import { defineConfig } from "@adobe/aio-commerce-lib-extensibility";

// In extensibility.config.js
export default defineConfig({
  // You get autocompletion and type-safety for the config object.
  businessConfig: { ... }
});
```
