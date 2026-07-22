# `validateCommerceAppConfigDomain()`

```ts
function validateCommerceAppConfigDomain<T>(config: unknown, domain: T): NonNullable<Get<{
  adminUi?: {
     customer?: {
        gridColumns?: {
           columns: ...[];
           description: string;
           label: string;
           runtimeAction: string;
        };
        massActions?: (... | ...)[];
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
        sandboxPermissions?: (... | ... | ...)[];
     };
     order?: {
        gridColumns?: {
           columns: ...[];
           description: string;
           label: string;
           runtimeAction: string;
        };
        massActions?: (... | ...)[];
        viewButtons?: (... | ...)[];
     };
     product?: {
        gridColumns?: {
           columns: ...[];
           description: string;
           label: string;
           runtimeAction: string;
        };
        massActions?: (... | ...)[];
     };
  };
  businessConfig?: {
     schema: (
        | {
        default: string;
        description?: string;
        env?: ...[];
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
        env?: ...[];
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
        default: SingleDefaultFactory;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        options: OptionsFactory;
        selectionMode: "single";
        type: "dynamicList";
      }
        | {
        default?: MultipleDefaultFactory;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        options: OptionsFactory;
        selectionMode: "multiple";
        type: "dynamicList";
      }
        | {
        default: string;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        type: "text";
      }
        | {
        default: "";
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        type: "password";
      }
        | {
        default: string;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        type: "email";
      }
        | {
        default: string;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        type: "url";
      }
        | {
        default: string;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        type: "tel";
      }
        | {
        default: boolean;
        description?: string;
        env?: ...[];
        label?: string;
        name: string;
        type: "boolean";
     })[];
  };
  eventing?: {
     commerce?: {
        events: {
           description: ...;
           destination?: ...;
           env?: ...;
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
           env?: ...;
           hipaa_audit_required?: ...;
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
     env?: (... | ...)[];
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
     env?: (... | ...)[];
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
}, T>>;
```

Defined in: [aio-commerce-lib-app/source/config/lib/validate.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/lib/validate.ts#L110)

Validates a specific domain configuration within the commerce app config.

This function validates only a specific domain's configuration rather than
the entire commerce app configuration object. It first validates that the
domain name is valid, then validates the configuration data against the
schema for that specific domain.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                    | Description                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `T` _extends_ \| `"metadata"` \| `"adminUi"` \| `"businessConfig"` \| `"eventing"` \| `"installation"` \| `"webhooks"` \| `"businessConfig.schema"` \| `"eventing.commerce"` \| `"eventing.external"` \| `"installation.customInstallationSteps"` | The type of the domain, constrained to valid domain names. |

## Parameters

| Parameter | Type      | Description                                                         |
| --------- | --------- | ------------------------------------------------------------------- |
| `config`  | `unknown` | The domain configuration object to validate.                        |
| `domain`  | `T`       | The name of the domain to validate (e.g., 'businessConfiguration'). |

## Returns

`NonNullable`\<`Get`\<\{
`adminUi?`: \{
`customer?`: \{
`gridColumns?`: \{
`columns`: ...[];
`description`: `string`;
`label`: `string`;
`runtimeAction`: `string`;
\};
`massActions?`: (... \| ...)[];
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
`sandboxPermissions?`: (... \| ... \| ...)[];
\};
`order?`: \{
`gridColumns?`: \{
`columns`: ...[];
`description`: `string`;
`label`: `string`;
`runtimeAction`: `string`;
\};
`massActions?`: (... \| ...)[];
`viewButtons?`: (... \| ...)[];
\};
`product?`: \{
`gridColumns?`: \{
`columns`: ...[];
`description`: `string`;
`label`: `string`;
`runtimeAction`: `string`;
\};
`massActions?`: (... \| ...)[];
\};
\};
`businessConfig?`: \{
`schema`: (
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`options`: \{
`label`: ...;
`value`: ...;
\}[];
`selectionMode`: `"single"`;
`type`: `"list"`;
\}
\| \{
`default`: `string`[];
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`options`: \{
`label`: ...;
`value`: ...;
\}[];
`selectionMode`: `"multiple"`;
`type`: `"list"`;
\}
\| \{
`default`: `SingleDefaultFactory`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`options`: `OptionsFactory`;
`selectionMode`: `"single"`;
`type`: `"dynamicList"`;
\}
\| \{
`default?`: `MultipleDefaultFactory`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`options`: `OptionsFactory`;
`selectionMode`: `"multiple"`;
`type`: `"dynamicList"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`type`: `"text"`;
\}
\| \{
`default`: `""`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`type`: `"password"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`type`: `"email"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`type`: `"url"`;
\}
\| \{
`default`: `string`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`type`: `"tel"`;
\}
\| \{
`default`: `boolean`;
`description?`: `string`;
`env?`: ...[];
`label?`: `string`;
`name`: `string`;
`type`: `"boolean"`;
\})[];
\};
`eventing?`: \{
`commerce?`: \{
`events`: \{
`description`: ...;
`destination?`: ...;
`env?`: ...;
`fields`: ...;
`force?`: ...;
`hipaa_audit_required?`: ...;
`label`: ...;
`name`: ...;
`priority?`: ...;
`rules?`: ...;
`runtimeActions`: ...;
\}[];
`provider`: \{
`description`: `string`;
`key?`: ... \| ...;
`label`: `string`;
\};
\}[];
`external?`: \{
`events`: \{
`description`: ...;
`env?`: ...;
`hipaa_audit_required?`: ...;
`label`: ...;
`name`: ...;
`runtimeActions`: ...;
\}[];
`provider`: \{
`description`: `string`;
`key?`: ... \| ...;
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
`env?`: (... \| ...)[];
`label`: `string`;
`requireAdobeAuth?`: `boolean`;
`runtimeAction`: `string`;
`webhook`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`fallback_error_message?`: `string`;
`fields?`: ...[];
`headers?`: ...[];
`hook_name`: `string`;
`method`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: ...[];
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
`env?`: (... \| ...)[];
`label`: `string`;
`webhook`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`fallback_error_message?`: `string`;
`fields?`: ...[];
`headers?`: ...[];
`hook_name`: `string`;
`method`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: ...[];
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
\}, `T`\>\>

The validated and typed configuration for the specified domain.

## Throws

If the domain name is invalid or if the
configuration doesn't match the domain's schema.

## Example

```typescript
const businessConfig = {
  fields: [
    {
      name: "category",
      type: "dropdown",
      // ... field configuration
    },
  ],
};

try {
  const validatedConfig = validateCommerceAppConfigDomain(
    businessConfig,
    "businessConfig",
  );
  // Use validatedConfig safely
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error("Domain validation failed:", error.issues);
  }
}
```
