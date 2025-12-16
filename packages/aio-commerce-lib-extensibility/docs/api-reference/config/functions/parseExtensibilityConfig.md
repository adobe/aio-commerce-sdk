# `parseExtensibilityConfig()`

```ts
function parseExtensibilityConfig(cwd: string): Promise<{
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

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts#L138)

Read the extensibility config file and parse its contents into its schema.

Supports multiple config file formats (see [resolveExtensibilityConfig](resolveExtensibilityConfig.md) for the list).
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
