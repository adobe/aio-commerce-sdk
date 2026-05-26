# `hasEventing()`

```ts
function hasEventing(config: {
  adminUiSdk?: {
     registration: {
        bannerNotification?: {
           massActions?: {
              customer?: ...[];
              order?: ...[];
              product?: ...[];
           };
           orderViewButtons?: {
              buttonId: string;
              errorMessage?: ... | ...;
              successMessage?: ... | ...;
           }[];
        };
        customer?: {
           gridColumns?: {
              data: {
                 meshId: string;
              };
              properties: {
                 align: ...;
                 columnId: ...;
                 label: ...;
                 type: ...;
              }[];
           };
           massActions?: unknown[];
        };
        menuItems?: {
           id: string;
           isSection?: boolean;
           parent?: string;
           sandbox?: string;
           sortOrder?: number;
           title?: string;
        }[];
        order?: {
           customFees?: {
              applyFeeOnLastCreditMemo?: ... | ... | ...;
              applyFeeOnLastInvoice?: ... | ... | ...;
              id: string;
              label: string;
              orderMinimumAmount?: ... | ...;
              value: number;
           }[];
           gridColumns?: {
              data: {
                 meshId: string;
              };
              properties: {
                 align: ...;
                 columnId: ...;
                 label: ...;
                 type: ...;
              }[];
           };
           massActions?: unknown[];
           viewButtons?: unknown[];
        };
        product?: {
           gridColumns?: {
              data: {
                 meshId: string;
              };
              properties: {
                 align: ...;
                 columnId: ...;
                 label: ...;
                 type: ...;
              }[];
           };
           massActions?: unknown[];
        };
     };
  };
  businessConfig?: {
     schema: (
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
     })[];
  };
  eventing?: {
     commerce?: {
        events: {
           description: string;
           destination?: string;
           fields: {
              name: ...;
              source?: ...;
           }[];
           force?: boolean;
           hipaa_audit_required?: boolean;
           label: string;
           name: string;
           priority?: boolean;
           rules?: ...[];
           runtimeActions: string[];
        }[];
        provider: {
           description: string;
           key?: string;
           label: string;
        };
     }[];
     external?: {
        events: {
           description: string;
           label: string;
           name: string;
           runtimeActions: string[];
        }[];
        provider: {
           description: string;
           key?: string;
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
        fields?: {
           name: string;
           source?: ... | ...;
        }[];
        headers?: {
           name: string;
           value: string;
        }[];
        hook_name: string;
        method: string;
        priority?: number;
        required?: boolean;
        rules?: {
           field: string;
           operator: string;
           value: string;
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
           name: string;
           source?: ... | ...;
        }[];
        headers?: {
           name: string;
           value: string;
        }[];
        hook_name: string;
        method: string;
        priority?: number;
        required?: boolean;
        rules?: {
           field: string;
           operator: string;
           value: string;
        }[];
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
}): config is EventsConfig;
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:351](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L351)

Check if config has any eventing configuration.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Description                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `config`  | \{ `adminUiSdk?`: \{ `registration`: \{ `bannerNotification?`: \{ `massActions?`: \{ `customer?`: ...[]; `order?`: ...[]; `product?`: ...[]; \}; `orderViewButtons?`: \{ `buttonId`: `string`; `errorMessage?`: ... \| ...; `successMessage?`: ... \| ...; \}[]; \}; `customer?`: \{ `gridColumns?`: \{ `data`: \{ `meshId`: `string`; \}; `properties`: \{ `align`: ...; `columnId`: ...; `label`: ...; `type`: ...; \}[]; \}; `massActions?`: `unknown`[]; \}; `menuItems?`: \{ `id`: `string`; `isSection?`: `boolean`; `parent?`: `string`; `sandbox?`: `string`; `sortOrder?`: `number`; `title?`: `string`; \}[]; `order?`: \{ `customFees?`: \{ `applyFeeOnLastCreditMemo?`: ... \| ... \| ...; `applyFeeOnLastInvoice?`: ... \| ... \| ...; `id`: `string`; `label`: `string`; `orderMinimumAmount?`: ... \| ...; `value`: `number`; \}[]; `gridColumns?`: \{ `data`: \{ `meshId`: `string`; \}; `properties`: \{ `align`: ...; `columnId`: ...; `label`: ...; `type`: ...; \}[]; \}; `massActions?`: `unknown`[]; `viewButtons?`: `unknown`[]; \}; `product?`: \{ `gridColumns?`: \{ `data`: \{ `meshId`: `string`; \}; `properties`: \{ `align`: ...; `columnId`: ...; `label`: ...; `type`: ...; \}[]; \}; `massActions?`: `unknown`[]; \}; \}; \}; `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default`: `""`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \} \| \{ `default`: `boolean`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"boolean"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: `string`; `destination?`: `string`; `fields`: \{ `name`: ...; `source?`: ...; \}[]; `force?`: `boolean`; `hipaa_audit_required?`: `boolean`; `label`: `string`; `name`: `string`; `priority?`: `boolean`; `rules?`: ...[]; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: `string`; `label`: `string`; `name`: `string`; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; `webhooks?`: ( \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `requireAdobeAuth?`: `boolean`; `runtimeAction`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: \{ `name`: `string`; `source?`: ... \| ...; \}[]; `headers?`: \{ `name`: `string`; `value`: `string`; \}[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \} \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: \{ `name`: `string`; `source?`: ... \| ...; \}[]; `headers?`: \{ `name`: `string`; `value`: `string`; \}[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `url`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \})[]; \} & \{ \[`key`: `string`\]: `unknown`; \} | The configuration to check. |

## Returns

`config is EventsConfig`
