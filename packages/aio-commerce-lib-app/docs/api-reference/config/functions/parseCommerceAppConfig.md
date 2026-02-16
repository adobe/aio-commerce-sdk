# `parseCommerceAppConfig()`

```ts
function parseCommerceAppConfig(cwd?: string): Promise<{
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
           description: string;
           destination?: ... | ...;
           fields: ...[];
           force?: ... | ... | ...;
           hipaaAuditRequired?: ... | ... | ...;
           label: string;
           name: string;
           prioritary?: ... | ... | ...;
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
} & {
[key: string]: unknown;
}>;
```

Defined in: [config/lib/parser.ts:135](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L135)

Read the commerce app config file and parse its contents into its schema.

Supports multiple config file formats (see [resolveCommerceAppConfig](resolveCommerceAppConfig.md) for the list).
The config file must export a default export with the configuration object.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<\{
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
`description`: `string`;
`destination?`: ... \| ...;
`fields`: ...[];
`force?`: ... \| ... \| ...;
`hipaaAuditRequired?`: ... \| ... \| ...;
`label`: `string`;
`name`: `string`;
`prioritary?`: ... \| ... \| ...;
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
\} & \{
\[`key`: `string`\]: `unknown`;
\}\>

The validated and parsed config object

## Throws

If no config file is found, if the file doesn't export a default export, or if validation fails
