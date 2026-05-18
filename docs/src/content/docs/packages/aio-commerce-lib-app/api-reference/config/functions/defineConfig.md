---
title: "defineConfig()"
editUrl: false
prev: false
next: false
---

```ts
function defineConfig(config: {
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
           massActions?: {
              actionId: string;
              confirm?: ... | ...;
              customerSelectLimit?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              path: string;
              sandbox?: ... | ...;
              timeout?: ... | ...;
              title?: ... | ...;
           }[];
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
           massActions?: {
              actionId: string;
              confirm?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              path: string;
              sandbox?: ... | ...;
              selectionLimit?: ... | ...;
              timeout?: ... | ...;
              title?: ... | ...;
           }[];
           viewButtons?: {
              buttonId: string;
              confirm?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              level?: ... | ... | ... | ...;
              path: string;
              sandbox?: ... | ...;
              sortOrder?: ... | ...;
              timeout?: ... | ...;
           }[];
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
           massActions?: {
              actionId: string;
              confirm?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              path: string;
              productSelectLimit?: ... | ...;
              sandbox?: ... | ...;
              timeout?: ... | ...;
              title?: ... | ...;
           }[];
        };
     };
  };
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
        default?: "";
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
      }
        | {
        default?: boolean;
        description?: string;
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
}): {
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
           massActions?: {
              actionId: string;
              confirm?: ... | ...;
              customerSelectLimit?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              path: string;
              sandbox?: ... | ...;
              timeout?: ... | ...;
              title?: ... | ...;
           }[];
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
           massActions?: {
              actionId: string;
              confirm?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              path: string;
              sandbox?: ... | ...;
              selectionLimit?: ... | ...;
              timeout?: ... | ...;
              title?: ... | ...;
           }[];
           viewButtons?: {
              buttonId: string;
              confirm?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              level?: ... | ... | ... | ...;
              path: string;
              sandbox?: ... | ...;
              sortOrder?: ... | ...;
              timeout?: ... | ...;
           }[];
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
           massActions?: {
              actionId: string;
              confirm?: ... | ...;
              displayIframe?: ... | ... | ...;
              label: string;
              path: string;
              productSelectLimit?: ... | ...;
              sandbox?: ... | ...;
              timeout?: ... | ...;
              title?: ... | ...;
           }[];
        };
     };
  };
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
        default?: "";
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
      }
        | {
        default?: boolean;
        description?: string;
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
};
```

Defined in: [aio-commerce-lib-app/source/config/lib/define.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/config/lib/define.ts#L29)

Helper to type-safely define the app config.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Description               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| `config`  | \{ `adminUiSdk?`: \{ `registration`: \{ `bannerNotification?`: \{ `massActions?`: \{ `customer?`: ...[]; `order?`: ...[]; `product?`: ...[]; \}; `orderViewButtons?`: \{ `buttonId`: `string`; `errorMessage?`: ... \| ...; `successMessage?`: ... \| ...; \}[]; \}; `customer?`: \{ `gridColumns?`: \{ `data`: \{ `meshId`: `string`; \}; `properties`: \{ `align`: ...; `columnId`: ...; `label`: ...; `type`: ...; \}[]; \}; `massActions?`: \{ `actionId`: `string`; `confirm?`: ... \| ...; `customerSelectLimit?`: ... \| ...; `displayIframe?`: ... \| ... \| ...; `label`: `string`; `path`: `string`; `sandbox?`: ... \| ...; `timeout?`: ... \| ...; `title?`: ... \| ...; \}[]; \}; `menuItems?`: \{ `id`: `string`; `isSection?`: `boolean`; `parent?`: `string`; `sandbox?`: `string`; `sortOrder?`: `number`; `title?`: `string`; \}[]; `order?`: \{ `customFees?`: \{ `applyFeeOnLastCreditMemo?`: ... \| ... \| ...; `applyFeeOnLastInvoice?`: ... \| ... \| ...; `id`: `string`; `label`: `string`; `orderMinimumAmount?`: ... \| ...; `value`: `number`; \}[]; `gridColumns?`: \{ `data`: \{ `meshId`: `string`; \}; `properties`: \{ `align`: ...; `columnId`: ...; `label`: ...; `type`: ...; \}[]; \}; `massActions?`: \{ `actionId`: `string`; `confirm?`: ... \| ...; `displayIframe?`: ... \| ... \| ...; `label`: `string`; `path`: `string`; `sandbox?`: ... \| ...; `selectionLimit?`: ... \| ...; `timeout?`: ... \| ...; `title?`: ... \| ...; \}[]; `viewButtons?`: \{ `buttonId`: `string`; `confirm?`: ... \| ...; `displayIframe?`: ... \| ... \| ...; `label`: `string`; `level?`: ... \| ... \| ... \| ...; `path`: `string`; `sandbox?`: ... \| ...; `sortOrder?`: ... \| ...; `timeout?`: ... \| ...; \}[]; \}; `product?`: \{ `gridColumns?`: \{ `data`: \{ `meshId`: `string`; \}; `properties`: \{ `align`: ...; `columnId`: ...; `label`: ...; `type`: ...; \}[]; \}; `massActions?`: \{ `actionId`: `string`; `confirm?`: ... \| ...; `displayIframe?`: ... \| ... \| ...; `label`: `string`; `path`: `string`; `productSelectLimit?`: ... \| ...; `sandbox?`: ... \| ...; `timeout?`: ... \| ...; `title?`: ... \| ...; \}[]; \}; \}; \}; `businessConfig?`: \{ `schema?`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `""`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \} \| \{ `default?`: `boolean`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"boolean"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: `string`; `destination?`: `string`; `fields`: \{ `name`: ...; `source?`: ...; \}[]; `force?`: `boolean`; `hipaa_audit_required?`: `boolean`; `label`: `string`; `name`: `string`; `priority?`: `boolean`; `rules?`: ...[]; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: `string`; `label`: `string`; `name`: `string`; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; `webhooks?`: ( \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `requireAdobeAuth?`: `boolean`; `runtimeAction`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: \{ `name`: `string`; `source?`: ... \| ...; \}[]; `headers?`: \{ `name`: `string`; `value`: `string`; \}[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \} \| \{ `category?`: `"validation"` \| `"append"` \| `"modification"`; `description`: `string`; `label`: `string`; `webhook`: \{ `batch_name`: `string`; `batch_order?`: `number`; `fallback_error_message?`: `string`; `fields?`: \{ `name`: `string`; `source?`: ... \| ...; \}[]; `headers?`: \{ `name`: `string`; `value`: `string`; \}[]; `hook_name`: `string`; `method`: `string`; `priority?`: `number`; `required?`: `boolean`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; `soft_timeout?`: `number`; `timeout?`: `number`; `ttl?`: `number`; `url`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}; \})[]; \} & \{ \[`key`: `string`\]: `unknown`; \} | The app config to define. |

## Returns

\{
`adminUiSdk?`: \{
`registration`: \{
`bannerNotification?`: \{
`massActions?`: \{
`customer?`: ...[];
`order?`: ...[];
`product?`: ...[];
\};
`orderViewButtons?`: \{
`buttonId`: `string`;
`errorMessage?`: ... \| ...;
`successMessage?`: ... \| ...;
\}[];
\};
`customer?`: \{
`gridColumns?`: \{
`data`: \{
`meshId`: `string`;
\};
`properties`: \{
`align`: ...;
`columnId`: ...;
`label`: ...;
`type`: ...;
\}[];
\};
`massActions?`: \{
`actionId`: `string`;
`confirm?`: ... \| ...;
`customerSelectLimit?`: ... \| ...;
`displayIframe?`: ... \| ... \| ...;
`label`: `string`;
`path`: `string`;
`sandbox?`: ... \| ...;
`timeout?`: ... \| ...;
`title?`: ... \| ...;
\}[];
\};
`menuItems?`: \{
`id`: `string`;
`isSection?`: `boolean`;
`parent?`: `string`;
`sandbox?`: `string`;
`sortOrder?`: `number`;
`title?`: `string`;
\}[];
`order?`: \{
`customFees?`: \{
`applyFeeOnLastCreditMemo?`: ... \| ... \| ...;
`applyFeeOnLastInvoice?`: ... \| ... \| ...;
`id`: `string`;
`label`: `string`;
`orderMinimumAmount?`: ... \| ...;
`value`: `number`;
\}[];
`gridColumns?`: \{
`data`: \{
`meshId`: `string`;
\};
`properties`: \{
`align`: ...;
`columnId`: ...;
`label`: ...;
`type`: ...;
\}[];
\};
`massActions?`: \{
`actionId`: `string`;
`confirm?`: ... \| ...;
`displayIframe?`: ... \| ... \| ...;
`label`: `string`;
`path`: `string`;
`sandbox?`: ... \| ...;
`selectionLimit?`: ... \| ...;
`timeout?`: ... \| ...;
`title?`: ... \| ...;
\}[];
`viewButtons?`: \{
`buttonId`: `string`;
`confirm?`: ... \| ...;
`displayIframe?`: ... \| ... \| ...;
`label`: `string`;
`level?`: ... \| ... \| ... \| ...;
`path`: `string`;
`sandbox?`: ... \| ...;
`sortOrder?`: ... \| ...;
`timeout?`: ... \| ...;
\}[];
\};
`product?`: \{
`gridColumns?`: \{
`data`: \{
`meshId`: `string`;
\};
`properties`: \{
`align`: ...;
`columnId`: ...;
`label`: ...;
`type`: ...;
\}[];
\};
`massActions?`: \{
`actionId`: `string`;
`confirm?`: ... \| ...;
`displayIframe?`: ... \| ... \| ...;
`label`: `string`;
`path`: `string`;
`productSelectLimit?`: ... \| ...;
`sandbox?`: ... \| ...;
`timeout?`: ... \| ...;
`title?`: ... \| ...;
\}[];
\};
\};
\};
`businessConfig?`: \{
`schema?`: (
\| \{
`default`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`options`: \{
`label`: `string`;
`value`: `string`;
\}[];
`selectionMode`: `"single"`;
`type`: `"list"`;
\}
\| \{
`default?`: `string`[];
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`options`: \{
`label`: `string`;
`value`: `string`;
\}[];
`selectionMode`: `"multiple"`;
`type`: `"list"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"text"`;
\}
\| \{
`default?`: `""`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"password"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"email"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"url"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"tel"`;
\}
\| \{
`default?`: `boolean`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"boolean"`;
\})[];
\};
`eventing?`: \{
`commerce?`: \{
`events`: \{
`description`: `string`;
`destination?`: `string`;
`fields`: \{
`name`: ...;
`source?`: ...;
\}[];
`force?`: `boolean`;
`hipaa_audit_required?`: `boolean`;
`label`: `string`;
`name`: `string`;
`priority?`: `boolean`;
`rules?`: ...[];
`runtimeActions`: `string`[];
\}[];
`provider`: \{
`description`: `string`;
`key?`: `string`;
`label`: `string`;
\};
\}[];
`external?`: \{
`events`: \{
`description`: `string`;
`label`: `string`;
`name`: `string`;
`runtimeActions`: `string`[];
\}[];
`provider`: \{
`description`: `string`;
`key?`: `string`;
`label`: `string`;
\};
\}[];
\};
`installation?`: \{
`customInstallationSteps?`: \{
`description`: `string`;
`name`: `string`;
`script`: `string`;
\}[];
`messages?`: \{
`postInstallation?`: `string`;
`preInstallation?`: `string`;
\};
\};
`metadata`: \{
`description`: `string`;
`displayName`: `string`;
`id`: `string`;
`version`: `string`;
\};
`webhooks?`: (
\| \{
`category?`: `"validation"` \| `"append"` \| `"modification"`;
`description`: `string`;
`label`: `string`;
`requireAdobeAuth?`: `boolean`;
`runtimeAction`: `string`;
`webhook`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`fallback_error_message?`: `string`;
`fields?`: \{
`name`: `string`;
`source?`: ... \| ...;
\}[];
`headers?`: \{
`name`: `string`;
`value`: `string`;
\}[];
`hook_name`: `string`;
`method`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: \{
`field`: `string`;
`operator`: `string`;
`value`: `string`;
\}[];
`soft_timeout?`: `number`;
`timeout?`: `number`;
`ttl?`: `number`;
`webhook_method`: `string`;
`webhook_type`: `string`;
\};
\}
\| \{
`category?`: `"validation"` \| `"append"` \| `"modification"`;
`description`: `string`;
`label`: `string`;
`webhook`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`fallback_error_message?`: `string`;
`fields?`: \{
`name`: `string`;
`source?`: ... \| ...;
\}[];
`headers?`: \{
`name`: `string`;
`value`: `string`;
\}[];
`hook_name`: `string`;
`method`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: \{
`field`: `string`;
`operator`: `string`;
`value`: `string`;
\}[];
`soft_timeout?`: `number`;
`timeout?`: `number`;
`ttl?`: `number`;
`url`: `string`;
`webhook_method`: `string`;
`webhook_type`: `string`;
\};
\})[];
\} & \{
\[`key`: `string`\]: `unknown`;
\}

## Example

```typescript
import { defineConfig } from "@adobe/aio-commerce-lib-app";

// In app.commerce.config.js
export default defineConfig({
  // You get autocompletion and type-safety for the config object.
  businessConfig: { ... }
});
```
