# `readBundledExtensibilityConfig()`

```ts
function readBundledExtensibilityConfig(): Promise<{
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

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts:148](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts#L148)

Read the bundled extensibility config file

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

## Throws

If the bundled extensibility config file is not found or if it is invalid
