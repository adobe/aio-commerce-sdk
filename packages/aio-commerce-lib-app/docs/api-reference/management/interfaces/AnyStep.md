# `AnyStep`

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:165](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L165)

Loosely-typed step for use in non type-safe contexts.

## Properties

### children?

```ts
optional children: AnyStep[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:166](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L166)

---

### context()?

```ts
optional context: (context: InstallationContext) => any;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:169](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L169)

#### Parameters

| Parameter | Type                                                            |
| --------- | --------------------------------------------------------------- |
| `context` | [`InstallationContext`](../type-aliases/InstallationContext.md) |

#### Returns

`any`

---

### meta

```ts
meta: StepMeta;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:170](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L170)

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:171](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L171)

---

### run()?

```ts
optional run: (config: any, context: any) => unknown;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:172](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L172)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

`unknown`

---

### type

```ts
type: "leaf" | "branch";
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:173](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L173)

---

### validate()?

```ts
optional validate: (config: any, context: any) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:174](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L174)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

\| [`ValidationIssue`](../type-aliases/ValidationIssue.md)[]
\| `Promise`\<[`ValidationIssue`](../type-aliases/ValidationIssue.md)[]\>

---

### when()?

```ts
optional when: (config: {
  businessConfig?: {
     schema: (
        | {
        default: string;
        description?: string;
        label?: string;
        name: string;
        options: {
           label: ...;
           value: ...;
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
           label: ...;
           value: ...;
        }[];
        selectionMode: "multiple";
        type: "list";
      }
        | {
        default: string;
        description?: string;
        label?: string;
        name: string;
        type: "text";
      }
        | {
        default: "";
        description?: string;
        label?: string;
        name: string;
        type: "password";
      }
        | {
        default: string;
        description?: string;
        label?: string;
        name: string;
        type: "email";
      }
        | {
        default: string;
        description?: string;
        label?: string;
        name: string;
        type: "url";
      }
        | {
        default: string;
        description?: string;
        label?: string;
        name: string;
        type: "tel";
     })[];
  };
  eventing?: {
     commerce?: {
        events: {
           description: ...;
           destination?: ...;
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
     }[];
     external?: {
        events: {
           description: ...;
           label: ...;
           name: ...;
           runtimeActions: ...;
        }[];
        provider: {
           description: string;
           key?: ... | ...;
           label: string;
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
  })[];
} & {
[key: string]: unknown;
}) => boolean;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:179](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L179)

#### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config`  | \{ `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: ...; `value`: ...; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: ...; `value`: ...; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default`: `""`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: ...; `destination?`: ...; `fields`: ...; `force?`: ...; `hipaa_audit_required?`: ...; `label`: ...; `name`: ...; `priority?`: ...; `rules?`: ...; `runtimeActions`: ...; \}[]; `provider`: \{ `description`: `string`; `key?`: ... \| ...; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: ...; `label`: ...; `name`: ...; `runtimeActions`: ...; \}[]; `provider`: \{ `description`: `string`; `key?`: ... \| ...; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; `webhooks?`: ( \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `requireAdobeAuth?`: `boolean`; `runtimeAction`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: ...[]; `headers?`: ...[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: ...[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \} \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: ...[]; `headers?`: ...[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: ...[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `url`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \})[]; \} & \{ \[`key`: `string`\]: `unknown`; \} |

#### Returns

`boolean`
