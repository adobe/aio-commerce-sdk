# `parseCommerceAppConfig()`

```ts
function parseCommerceAppConfig(cwd?: string): Promise<{
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
           description: string;
           destination?: ... | ...;
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

Defined in: [aio-commerce-lib-app/source/config/lib/parser.ts:135](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L135)

Read the commerce app config file and parse its contents into its schema.

Supports multiple config file formats (see [resolveCommerceAppConfig](resolveCommerceAppConfig.md) for the list).
The config file must export a default export with the configuration object.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<\{
`adminUiSdk?`: \{
`registration`: \{
`menuItems`: \{
`id`: `string`;
`isSection?`: `boolean`;
`parent?`: `string`;
`sandbox?`: `string`;
`sortOrder?`: `number`;
`title?`: `string`;
\}[];
\};
\};
`businessConfig?`: \{
`schema`: (
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
`default`: `string`[];
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
`default`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"text"`;
\}
\| \{
`default`: `""`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"password"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"email"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"url"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"tel"`;
\})[];
\};
`eventing?`: \{
`commerce?`: \{
`events`: \{
`description`: `string`;
`destination?`: ... \| ...;
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
