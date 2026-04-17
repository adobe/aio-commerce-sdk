# `AnyStep`

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:182](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L182)

Loosely-typed step for use in non type-safe contexts.

## Properties

### children?

```ts
optional children?: AnyStep[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:183](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L183)

---

### context?

```ts
optional context?: (context: InstallationContext) => any;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:186](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L186)

#### Parameters

| Parameter | Type                                                            |
| --------- | --------------------------------------------------------------- |
| `context` | [`InstallationContext`](../type-aliases/InstallationContext.md) |

#### Returns

`any`

---

### install?

```ts
optional install?: (config: any, context: any) => unknown;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:187](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L187)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

`unknown`

---

### meta

```ts
meta: StepMeta;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:188](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L188)

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:189](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L189)

---

### type

```ts
type: "leaf" | "branch";
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:190](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L190)

---

### uninstall?

```ts
optional uninstall?: (config: any, context: any) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:192](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L192)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

`void` \| `Promise`\<`void`\>

---

### validate?

```ts
optional validate?: (config: any, context: any) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:194](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L194)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

\| [`ValidationIssue`](../type-aliases/ValidationIssue.md)[]
\| `Promise`\<[`ValidationIssue`](../type-aliases/ValidationIssue.md)[]\>

---

### when?

```ts
optional when?: (config: {
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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:199](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L199)

#### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`  | \{ `adminUiSdk?`: \{ `registration`: \{ `menuItems`: \{ `id`: `string`; `isSection?`: `boolean`; `parent?`: `string`; `sandbox?`: `string`; `sortOrder?`: `number`; `title?`: `string`; \}[]; \}; \}; `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: ...; `value`: ...; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: ...; `value`: ...; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default`: `""`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: ...; `destination?`: ...; `fields`: ...; `force?`: ...; `hipaa_audit_required?`: ...; `label`: ...; `name`: ...; `priority?`: ...; `rules?`: ...; `runtimeActions`: ...; \}[]; `provider`: \{ `description`: `string`; `key?`: ... \| ...; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: ...; `label`: ...; `name`: ...; `runtimeActions`: ...; \}[]; `provider`: \{ `description`: `string`; `key?`: ... \| ...; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; `webhooks?`: ( \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `requireAdobeAuth?`: `boolean`; `runtimeAction`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: ...[]; `headers?`: ...[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: ...[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \} \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: ...[]; `headers?`: ...[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: ...[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `url`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \})[]; \} & \{ \[`key`: `string`\]: `unknown`; \} |

#### Returns

`boolean`
