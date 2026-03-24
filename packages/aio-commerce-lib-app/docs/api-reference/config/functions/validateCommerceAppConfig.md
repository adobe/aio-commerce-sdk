# `validateCommerceAppConfig()`

```ts
function validateCommerceAppConfig(config: unknown): {
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

Defined in: [aio-commerce-lib-app/source/config/lib/validate.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/config/lib/validate.ts#L54)

Validates a complete commerce app configuration object against the schema.

## Parameters

| Parameter | Type      | Description                           |
| --------- | --------- | ------------------------------------- |
| `config`  | `unknown` | The configuration object to validate. |

## Returns

\{
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

The validated and typed configuration output model.

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
  const validatedConfig = validateCommerceAppConfig(config);
  // Use validatedConfig safely
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error("Validation failed:", error.display());
  }
}
```
