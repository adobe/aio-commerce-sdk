# `defineLeafStep()`

```ts
function defineLeafStep<TName, TConfig, TStepCtx, TOutput>(options: LeafStepOptions<TName, TConfig, TStepCtx, TOutput>): {
  meta: StepMeta;
  name: TName;
  run: (config: TConfig, context: ExecutionContext<TStepCtx>) => TOutput | Promise<TOutput>;
  type: "leaf";
  validate:   | (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
     | ValidationIssue[]
     | Promise<ValidationIssue[]>
     | undefined;
  when:   | (config: {
     adminUiSdk?: {
        registration: {
           menuItems: {
              id: string;
              isSection?: ... | ... | ...;
              parent?: ... | ...;
              sandbox?: ... | ...;
              sortOrder?: ... | ...;
              title?: ... | ...;
           }[];
        };
     };
     businessConfig?: {
        schema: (
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
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "text";
         }
           | {
           default: "";
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "password";
         }
           | {
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "email";
         }
           | {
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "url";
         }
           | {
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "tel";
        })[];
     };
     eventing?: {
        commerce?: {
           events: ...[];
           provider: {
              description: ...;
              key?: ...;
              label: ...;
           };
        }[];
        external?: {
           events: ...[];
           provider: {
              description: ...;
              key?: ...;
              label: ...;
           };
        }[];
     };
     installation?: {
        customInstallationSteps?: {
           description: string;
           name: string;
           script: string;
        }[];
        messages?: {
           postInstallation?: string;
           preInstallation?: string;
        };
     };
     metadata: {
        description: string;
        displayName: string;
        id: string;
        version: string;
     };
     webhooks?: (
        | {
        category?: "validation" | "append" | "modification";
        description: string;
        label: string;
        requireAdobeAuth?: boolean;
        runtimeAction: string;
        webhook: {
           batch_name: string;
           batch_order?: ... | ...;
           fallback_error_message?: ... | ...;
           fields?: ... | ...;
           headers?: ... | ...;
           hook_name: string;
           method: string;
           priority?: ... | ...;
           required?: ... | ... | ...;
           rules?: ... | ...;
           soft_timeout?: ... | ...;
           timeout?: ... | ...;
           ttl?: ... | ...;
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
           batch_order?: ... | ...;
           fallback_error_message?: ... | ...;
           fields?: ... | ...;
           headers?: ... | ...;
           hook_name: string;
           method: string;
           priority?: ... | ...;
           required?: ... | ... | ...;
           rules?: ... | ...;
           soft_timeout?: ... | ...;
           timeout?: ... | ...;
           ttl?: ... | ...;
           url: string;
           webhook_method: string;
           webhook_type: string;
        };
     })[];
   } & {
   [key: string]: unknown;
   }) => config is TConfig
     | undefined;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:225](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L225)

Define a leaf step (executable, no children).

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default type                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | -                               |
| `TConfig` _extends_ \{ `adminUiSdk?`: \{ `registration`: \{ `menuItems`: \{ `id`: `string`; `isSection?`: `boolean`; `parent?`: `string`; `sandbox?`: `string`; `sortOrder?`: `number`; `title?`: `string`; \}[]; \}; \}; `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default`: `""`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: `string`; `destination?`: `string`; `fields`: \{ `name`: ...; `source?`: ...; \}[]; `force?`: `boolean`; `hipaa_audit_required?`: `boolean`; `label`: `string`; `name`: `string`; `priority?`: `boolean`; `rules?`: ...[]; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: `string`; `label`: `string`; `name`: `string`; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; `webhooks?`: ( \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `requireAdobeAuth?`: `boolean`; `runtimeAction`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: \{ `name`: `string`; `source?`: ... \| ...; \}[]; `headers?`: \{ `name`: `string`; `value`: `string`; \}[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \} \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: \{ `name`: `string`; `source?`: ... \| ...; \}[]; `headers?`: \{ `name`: `string`; `value`: `string`; \}[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `url`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \})[]; \} & \{ \[`key`: `string`\]: `unknown`; \} | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `Record`\<`string`, `unknown`\> |
| `TOutput`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `unknown`                       |

## Parameters

| Parameter | Type                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `options` | [`LeafStepOptions`](../type-aliases/LeafStepOptions.md)\<`TName`, `TConfig`, `TStepCtx`, `TOutput`\> |

## Returns

```ts
{
  meta: StepMeta;
  name: TName;
  run: (config: TConfig, context: ExecutionContext<TStepCtx>) => TOutput | Promise<TOutput>;
  type: "leaf";
  validate:   | (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
     | ValidationIssue[]
     | Promise<ValidationIssue[]>
     | undefined;
  when:   | (config: {
     adminUiSdk?: {
        registration: {
           menuItems: {
              id: string;
              isSection?: ... | ... | ...;
              parent?: ... | ...;
              sandbox?: ... | ...;
              sortOrder?: ... | ...;
              title?: ... | ...;
           }[];
        };
     };
     businessConfig?: {
        schema: (
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
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "text";
         }
           | {
           default: "";
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "password";
         }
           | {
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "email";
         }
           | {
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "url";
         }
           | {
           default: string;
           description?: ... | ...;
           label?: ... | ...;
           name: string;
           type: "tel";
        })[];
     };
     eventing?: {
        commerce?: {
           events: ...[];
           provider: {
              description: ...;
              key?: ...;
              label: ...;
           };
        }[];
        external?: {
           events: ...[];
           provider: {
              description: ...;
              key?: ...;
              label: ...;
           };
        }[];
     };
     installation?: {
        customInstallationSteps?: {
           description: string;
           name: string;
           script: string;
        }[];
        messages?: {
           postInstallation?: string;
           preInstallation?: string;
        };
     };
     metadata: {
        description: string;
        displayName: string;
        id: string;
        version: string;
     };
     webhooks?: (
        | {
        category?: "validation" | "append" | "modification";
        description: string;
        label: string;
        requireAdobeAuth?: boolean;
        runtimeAction: string;
        webhook: {
           batch_name: string;
           batch_order?: ... | ...;
           fallback_error_message?: ... | ...;
           fields?: ... | ...;
           headers?: ... | ...;
           hook_name: string;
           method: string;
           priority?: ... | ...;
           required?: ... | ... | ...;
           rules?: ... | ...;
           soft_timeout?: ... | ...;
           timeout?: ... | ...;
           ttl?: ... | ...;
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
           batch_order?: ... | ...;
           fallback_error_message?: ... | ...;
           fields?: ... | ...;
           headers?: ... | ...;
           hook_name: string;
           method: string;
           priority?: ... | ...;
           required?: ... | ... | ...;
           rules?: ... | ...;
           soft_timeout?: ... | ...;
           timeout?: ... | ...;
           ttl?: ... | ...;
           url: string;
           webhook_method: string;
           webhook_type: string;
        };
     })[];
   } & {
   [key: string]: unknown;
   }) => config is TConfig
     | undefined;
}
```

### meta

```ts
meta: StepMeta = options.meta;
```

### name

```ts
name: TName = options.name;
```

### run()

```ts
run: (config: TConfig, context: ExecutionContext<TStepCtx>) => TOutput | Promise<TOutput> = options.run;
```

#### Parameters

| Parameter | Type                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `config`  | `TConfig`                                                               |
| `context` | [`ExecutionContext`](../type-aliases/ExecutionContext.md)\<`TStepCtx`\> |

#### Returns

`TOutput` \| `Promise`\<`TOutput`\>

### type

```ts
type: "leaf" = "leaf";
```

### validate

```ts
validate:
  | (config: TConfig, context: ValidationExecutionContext<TStepCtx>) =>
  | ValidationIssue[]
  | Promise<ValidationIssue[]>
  | undefined = options.validate;
```

### when

```ts
when:
  | (config: {
  adminUiSdk?: {
     registration: {
        menuItems: {
           id: string;
           isSection?: ... | ... | ...;
           parent?: ... | ...;
           sandbox?: ... | ...;
           sortOrder?: ... | ...;
           title?: ... | ...;
        }[];
     };
  };
  businessConfig?: {
     schema: (
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
        default: string;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "text";
      }
        | {
        default: "";
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "password";
      }
        | {
        default: string;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "email";
      }
        | {
        default: string;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "url";
      }
        | {
        default: string;
        description?: ... | ...;
        label?: ... | ...;
        name: string;
        type: "tel";
     })[];
  };
  eventing?: {
     commerce?: {
        events: ...[];
        provider: {
           description: ...;
           key?: ...;
           label: ...;
        };
     }[];
     external?: {
        events: ...[];
        provider: {
           description: ...;
           key?: ...;
           label: ...;
        };
     }[];
  };
  installation?: {
     customInstallationSteps?: {
        description: string;
        name: string;
        script: string;
     }[];
     messages?: {
        postInstallation?: string;
        preInstallation?: string;
     };
  };
  metadata: {
     description: string;
     displayName: string;
     id: string;
     version: string;
  };
  webhooks?: (
     | {
     category?: "validation" | "append" | "modification";
     description: string;
     label: string;
     requireAdobeAuth?: boolean;
     runtimeAction: string;
     webhook: {
        batch_name: string;
        batch_order?: ... | ...;
        fallback_error_message?: ... | ...;
        fields?: ... | ...;
        headers?: ... | ...;
        hook_name: string;
        method: string;
        priority?: ... | ...;
        required?: ... | ... | ...;
        rules?: ... | ...;
        soft_timeout?: ... | ...;
        timeout?: ... | ...;
        ttl?: ... | ...;
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
        batch_order?: ... | ...;
        fallback_error_message?: ... | ...;
        fields?: ... | ...;
        headers?: ... | ...;
        hook_name: string;
        method: string;
        priority?: ... | ...;
        required?: ... | ... | ...;
        rules?: ... | ...;
        soft_timeout?: ... | ...;
        timeout?: ... | ...;
        ttl?: ... | ...;
        url: string;
        webhook_method: string;
        webhook_type: string;
     };
  })[];
} & {
[key: string]: unknown;
}) => config is TConfig
  | undefined = options.when;
```

## Example

```typescript
const createProviders = defineLeafStep({
  name: "providers",
  meta: {
    label: "Create Providers",
    description: "Creates I/O Events providers",
  },
  run: async ({ config, stepContext }) => {
    const { eventsClient } = stepContext;
    return eventsClient.createProvider(config.eventing);
  },
});
```
