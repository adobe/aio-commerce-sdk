# `parseCommerceAppConfig()`

```ts
function parseCommerceAppConfig(cwd: string): Promise<{
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
        }
    )[];
  };
  metadata: {
    description: string;
    displayName: string;
    id: string;
    version: string;
  };
}>;
```

Defined in: [packages/aio-commerce-lib-app/source/config/lib/parser.ts:140](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L140)

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
`metadata`: \{
`description`: `string`;
`displayName`: `string`;
`id`: `string`;
`version`: `string`;
\};
\}\>

The validated and parsed config object

## Throws

If no config file is found, if the file doesn't export a default export, or if validation fails
