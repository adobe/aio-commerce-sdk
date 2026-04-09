# `AnyStep`

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:166](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L166)

Loosely-typed step for use in non type-safe contexts.

## Properties

### children?

```ts
optional children: AnyStep[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:167](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L167)

---

### context()?

```ts
optional context: (context: InstallationContext) => any;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:170](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L170)

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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:171](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L171)

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:172](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L172)

---

### run()?

```ts
optional run: (config: any, context: any) => unknown;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:173](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L173)

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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:174](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L174)

---

### validate()?

```ts
optional validate: (config: any, context: any) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:175](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L175)

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
  adminUiSdk?: {
     registration: {
        menuItems: {
           id: string;
           isSection?: boolean;
           parent?: string;
           sandbox?: string;
           sortOrder?: number;
           title?: string;
        }[];
     };
  };
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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:180](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L180)

#### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`  | \{ `adminUiSdk?`: \{ `registration`: \{ `menuItems`: \{ `id`: `string`; `isSection?`: `boolean`; `parent?`: `string`; `sandbox?`: `string`; `sortOrder?`: `number`; `title?`: `string`; \}[]; \}; \}; `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: ...; `value`: ...; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: ...; `value`: ...; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default`: `""`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: ...; `destination?`: ...; `fields`: ...; `force?`: ...; `hipaa_audit_required?`: ...; `label`: ...; `name`: ...; `priority?`: ...; `rules?`: ...; `runtimeActions`: ...; \}[]; `provider`: \{ `description`: `string`; `key?`: ... \| ...; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: ...; `label`: ...; `name`: ...; `runtimeActions`: ...; \}[]; `provider`: \{ `description`: `string`; `key?`: ... \| ...; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; `webhooks?`: ( \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `requireAdobeAuth?`: `boolean`; `runtimeAction`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: ...[]; `headers?`: ...[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: ...[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \} \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: ...[]; `headers?`: ...[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: ...[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `url`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \})[]; \} & \{ \[`key`: `string`\]: `unknown`; \} |

#### Returns

`boolean`
