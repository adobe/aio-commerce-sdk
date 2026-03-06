# `validateCommerceAppConfigDomain()`

```ts
function validateCommerceAppConfigDomain<T>(config: unknown, domain: T): NonNullable<Get<{
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
        default?: string;
        description?: string;
        label?: string;
        name: string;
        type: "text";
      }
        | {
        default?: string;
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
     })[];
  };
  eventing?: {
     commerce?: {
        events: {
           description: ...;
           destination?: ...;
           fields: ...;
           force?: ...;
           hipaaAuditRequired?: ...;
           label: ...;
           name: ...;
           prioritary?: ...;
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
} & {
[key: string]: unknown;
}, T>>;
```

Defined in: [config/lib/validate.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/lib/validate.ts#L110)

Validates a specific domain configuration within the commerce app config.

This function validates only a specific domain's configuration rather than
the entire commerce app configuration object. It first validates that the
domain name is valid, then validates the configuration data against the
schema for that specific domain.

## Type Parameters

| Type Parameter                                                                                                                                                                                                     | Description                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `T` _extends_ \| `"metadata"` \| `"businessConfig"` \| `"eventing"` \| `"installation"` \| `"businessConfig.schema"` \| `"eventing.commerce"` \| `"eventing.external"` \| `"installation.customInstallationSteps"` | The type of the domain, constrained to valid domain names. |

## Parameters

| Parameter | Type      | Description                                                         |
| --------- | --------- | ------------------------------------------------------------------- |
| `config`  | `unknown` | The domain configuration object to validate.                        |
| `domain`  | `T`       | The name of the domain to validate (e.g., 'businessConfiguration'). |

## Returns

`NonNullable`\<`Get`\<\{
`businessConfig?`: \{
`schema`: (
\| \{
`default`: `string`;
`description?`: `string`;
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
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"text"`;
\}
\| \{
`default?`: `string`;
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
\})[];
\};
`eventing?`: \{
`commerce?`: \{
`events`: \{
`description`: ...;
`destination?`: ...;
`fields`: ...;
`force?`: ...;
`hipaaAuditRequired?`: ...;
`label`: ...;
`name`: ...;
`prioritary?`: ...;
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
