# `getConfigSchema()`

```ts
function getConfigSchema(options?: LibConfigOptions): Promise<
  (
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
        default?: string;
        description?: string;
        label?: string;
        name: string;
        type: "password";
      }
    | {
        default?: boolean;
        description?: string;
        label?: string;
        name: string;
        type: "boolean";
      }
    | {
        default?: number;
        description?: string;
        label?: string;
        name: string;
        type: "number";
      }
    | {
        default?: Date;
        description?: string;
        label?: string;
        name: string;
        type: "date";
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
  )[]
>;
```

Defined in: [packages/aio-commerce-lib-config/source/config-manager.ts:263](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/config-manager.ts#L263)

Gets the configuration schema with lazy initialization and version checking.

The schema defines the structure of configuration fields available in your application,
including field names, types, default values, and validation rules. The schema is
cached and automatically updated when the bundled schema version changes.

## Parameters

| Parameter  | Type                                                      | Description                                               |
| ---------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `options?` | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md) | Optional library configuration options for cache timeout. |

## Returns

`Promise`\<(
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
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"password"`;
\}
\| \{
`default?`: `boolean`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"boolean"`;
\}
\| \{
`default?`: `number`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"number"`;
\}
\| \{
`default?`: `Date`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"date"`;
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
\})[]\>

Promise resolving to an array of schema field definitions.

## Examples

```typescript
import { getConfigSchema } from "@adobe/aio-commerce-lib-config";

// Get the configuration schema
const schema = await getConfigSchema();
schema.forEach((field) => {
  console.log(`Field: ${field.name}`);
  console.log(`Type: ${field.type}`);
  console.log(`Default: ${field.default}`);
});
```

```typescript
import { getConfigSchema } from "@adobe/aio-commerce-lib-config";

// Get schema with custom cache timeout
const schema = await getConfigSchema({ cacheTimeout: 300000 });

// Find a specific field
const apiKeyField = schema.find((field) => field.name === "api_key");
if (apiKeyField) {
  console.log("API Key field found:", apiKeyField);
}
```
