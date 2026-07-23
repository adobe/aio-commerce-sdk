# `parseCommerceAppConfig()`

```ts
function parseCommerceAppConfig(cwd?: string): Promise<{
  adminUi?: {
     customer?: {
        gridColumns?: {
           columns: {
              aclProtected?: ...;
              align: ...;
              id: ...;
              label: ...;
              type: ...;
           }[];
           description: string;
           label: string;
           runtimeAction: string;
        };
        massActions?: (
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           notifications?: ...;
           path: ...;
           sandboxPermissions?: ...;
           selectionLimit?: ...;
           title?: ...;
           type: ...;
         }
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           notifications?: ...;
           runtimeAction: ...;
           selectionLimit?: ...;
           timeout?: ...;
           title?: ...;
           type: ...;
        })[];
     };
     menu?: {
        aclProtected?: boolean;
        description: string;
        id: string;
        label: string;
        pageTitle?: string;
        parentMenu?:   | "sales"
           | "catalog"
           | "customers"
           | "marketing"
           | "content"
           | "reports"
           | "stores"
           | "system";
        sandboxPermissions?: ("allow-downloads" | "allow-modals" | "allow-popups")[];
     };
     order?: {
        gridColumns?: {
           columns: {
              aclProtected?: ...;
              align: ...;
              id: ...;
              label: ...;
              type: ...;
           }[];
           description: string;
           label: string;
           runtimeAction: string;
        };
        massActions?: (
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           notifications?: ...;
           path: ...;
           sandboxPermissions?: ...;
           selectionLimit?: ...;
           title?: ...;
           type: ...;
         }
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           notifications?: ...;
           runtimeAction: ...;
           selectionLimit?: ...;
           timeout?: ...;
           title?: ...;
           type: ...;
        })[];
        viewButtons?: (
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           level?: ...;
           notifications?: ...;
           path: ...;
           sandboxPermissions?: ...;
           sortOrder?: ...;
           type: ...;
         }
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           level?: ...;
           notifications?: ...;
           runtimeAction: ...;
           sortOrder?: ...;
           timeout?: ...;
           type: ...;
        })[];
     };
     product?: {
        gridColumns?: {
           columns: {
              aclProtected?: ...;
              align: ...;
              id: ...;
              label: ...;
              type: ...;
           }[];
           description: string;
           label: string;
           runtimeAction: string;
        };
        massActions?: (
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           notifications?: ...;
           path: ...;
           sandboxPermissions?: ...;
           selectionLimit?: ...;
           title?: ...;
           type: ...;
         }
           | {
           aclProtected?: ...;
           confirm?: ...;
           description?: ...;
           id: ...;
           label: ...;
           notifications?: ...;
           runtimeAction: ...;
           selectionLimit?: ...;
           timeout?: ...;
           title?: ...;
           type: ...;
        })[];
     };
  };
  businessConfig?: {
     schema: (
        | {
        default: string;
        description?: string;
        env?: (... | ...)[];
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
        env?: (... | ...)[];
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
        env?: (... | ...)[];
        label?: string;
        name: string;
        options: OptionsFactory;
        selectionMode: "single";
        type: "dynamicList";
      }
        | {
        default?: MultipleDefaultFactory;
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        options: OptionsFactory;
        selectionMode: "multiple";
        type: "dynamicList";
      }
        | {
        default: string;
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        type: "text";
      }
        | {
        default: "";
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        type: "password";
      }
        | {
        default: string;
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        type: "email";
      }
        | {
        default: string;
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        type: "url";
      }
        | {
        default: string;
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        type: "tel";
      }
        | {
        default: boolean;
        description?: string;
        env?: (... | ...)[];
        label?: string;
        name: string;
        type: "boolean";
     })[];
  };
  eventing?: {
     commerce?: {
        events: {
           description: string;
           destination?: ... | ...;
           env?: ... | ...;
           fields: ...[];
           force?: ... | ... | ...;
           hipaa_audit_required?: ... | ... | ...;
           label: string;
           name: string;
           priority?: ... | ... | ...;
           rules?: ... | ...;
           runtimeActions: ...[];
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
           env?: ... | ...;
           hipaa_audit_required?: ... | ... | ...;
           label: string;
           name: string;
           runtimeActions: ...[];
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
     env?: ("paas" | "saas")[];
     label: string;
     requireAdobeAuth?: boolean;
     runtimeAction: string;
     webhook: {
        batch_name: string;
        batch_order?: number;
        fallback_error_message?: string;
        fields?: {
           name: ...;
           source?: ...;
        }[];
        headers?: {
           name: ...;
           value: ...;
        }[];
        hook_name: string;
        method: string;
        priority?: number;
        required?: boolean;
        rules?: {
           field: ...;
           operator: ...;
           value: ...;
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
     env?: ("paas" | "saas")[];
     label: string;
     webhook: {
        batch_name: string;
        batch_order?: number;
        fallback_error_message?: string;
        fields?: {
           name: ...;
           source?: ...;
        }[];
        headers?: {
           name: ...;
           value: ...;
        }[];
        hook_name: string;
        method: string;
        priority?: number;
        required?: boolean;
        rules?: {
           field: ...;
           operator: ...;
           value: ...;
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
}>;
```

Defined in: [aio-commerce-lib-app/source/config/lib/parser.ts:152](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L152)

Read the commerce app config file and parse its contents into its schema.

Supports multiple config file formats (see [resolveCommerceAppConfig](resolveCommerceAppConfig.md) for the list).
The config file must export a default export with the configuration object.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<\{
`adminUi?`: \{
`customer?`: \{
`gridColumns?`: \{
`columns`: \{
`aclProtected?`: ...;
`align`: ...;
`id`: ...;
`label`: ...;
`type`: ...;
\}[];
`description`: `string`;
`label`: `string`;
`runtimeAction`: `string`;
\};
`massActions?`: (
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`notifications?`: ...;
`path`: ...;
`sandboxPermissions?`: ...;
`selectionLimit?`: ...;
`title?`: ...;
`type`: ...;
\}
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`notifications?`: ...;
`runtimeAction`: ...;
`selectionLimit?`: ...;
`timeout?`: ...;
`title?`: ...;
`type`: ...;
\})[];
\};
`menu?`: \{
`aclProtected?`: `boolean`;
`description`: `string`;
`id`: `string`;
`label`: `string`;
`pageTitle?`: `string`;
`parentMenu?`: \| `"sales"`
\| `"catalog"`
\| `"customers"`
\| `"marketing"`
\| `"content"`
\| `"reports"`
\| `"stores"`
\| `"system"`;
`sandboxPermissions?`: (`"allow-downloads"` \| `"allow-modals"` \| `"allow-popups"`)[];
\};
`order?`: \{
`gridColumns?`: \{
`columns`: \{
`aclProtected?`: ...;
`align`: ...;
`id`: ...;
`label`: ...;
`type`: ...;
\}[];
`description`: `string`;
`label`: `string`;
`runtimeAction`: `string`;
\};
`massActions?`: (
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`notifications?`: ...;
`path`: ...;
`sandboxPermissions?`: ...;
`selectionLimit?`: ...;
`title?`: ...;
`type`: ...;
\}
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`notifications?`: ...;
`runtimeAction`: ...;
`selectionLimit?`: ...;
`timeout?`: ...;
`title?`: ...;
`type`: ...;
\})[];
`viewButtons?`: (
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`level?`: ...;
`notifications?`: ...;
`path`: ...;
`sandboxPermissions?`: ...;
`sortOrder?`: ...;
`type`: ...;
\}
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`level?`: ...;
`notifications?`: ...;
`runtimeAction`: ...;
`sortOrder?`: ...;
`timeout?`: ...;
`type`: ...;
\})[];
\};
`product?`: \{
`gridColumns?`: \{
`columns`: \{
`aclProtected?`: ...;
`align`: ...;
`id`: ...;
`label`: ...;
`type`: ...;
\}[];
`description`: `string`;
`label`: `string`;
`runtimeAction`: `string`;
\};
`massActions?`: (
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`notifications?`: ...;
`path`: ...;
`sandboxPermissions?`: ...;
`selectionLimit?`: ...;
`title?`: ...;
`type`: ...;
\}
\| \{
`aclProtected?`: ...;
`confirm?`: ...;
`description?`: ...;
`id`: ...;
`label`: ...;
`notifications?`: ...;
`runtimeAction`: ...;
`selectionLimit?`: ...;
`timeout?`: ...;
`title?`: ...;
`type`: ...;
\})[];
\};
\};
`businessConfig?`: \{
`schema`: (
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: (... \| ...)[];
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
`default`: `string`[];
`description?`: `string`;
`env?`: (... \| ...)[];
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
`default`: `SingleDefaultFactory`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`options`: `OptionsFactory`;
`selectionMode`: `"single"`;
`type`: `"dynamicList"`;
\}
\| \{
`default?`: `MultipleDefaultFactory`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`options`: `OptionsFactory`;
`selectionMode`: `"multiple"`;
`type`: `"dynamicList"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`type`: `"text"`;
\}
\| \{
`default`: `""`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`type`: `"password"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`type`: `"email"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`type`: `"url"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`type`: `"tel"`;
\}
\| \{
`default`: `boolean`;
`description?`: `string`;
`env?`: (... \| ...)[];
`label?`: `string`;
`name`: `string`;
`type`: `"boolean"`;
\})[];
\};
`eventing?`: \{
`commerce?`: \{
`events`: \{
`description`: `string`;
`destination?`: ... \| ...;
`env?`: ... \| ...;
`fields`: ...[];
`force?`: ... \| ... \| ...;
`hipaa_audit_required?`: ... \| ... \| ...;
`label`: `string`;
`name`: `string`;
`priority?`: ... \| ... \| ...;
`rules?`: ... \| ...;
`runtimeActions`: ...[];
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
`env?`: ... \| ...;
`hipaa_audit_required?`: ... \| ... \| ...;
`label`: `string`;
`name`: `string`;
`runtimeActions`: ...[];
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
`env?`: (`"paas"` \| `"saas"`)[];
`label`: `string`;
`requireAdobeAuth?`: `boolean`;
`runtimeAction`: `string`;
`webhook`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`fallback_error_message?`: `string`;
`fields?`: \{
`name`: ...;
`source?`: ...;
\}[];
`headers?`: \{
`name`: ...;
`value`: ...;
\}[];
`hook_name`: `string`;
`method`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: \{
`field`: ...;
`operator`: ...;
`value`: ...;
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
`env?`: (`"paas"` \| `"saas"`)[];
`label`: `string`;
`webhook`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`fallback_error_message?`: `string`;
`fields?`: \{
`name`: ...;
`source?`: ...;
\}[];
`headers?`: \{
`name`: ...;
`value`: ...;
\}[];
`hook_name`: `string`;
`method`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: \{
`field`: ...;
`operator`: ...;
`value`: ...;
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
\}\>

The validated and parsed config object

## Throws

If no config file is found, if the file doesn't export a default export, or if validation fails
