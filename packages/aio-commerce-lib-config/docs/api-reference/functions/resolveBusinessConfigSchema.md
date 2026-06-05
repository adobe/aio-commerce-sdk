# `resolveBusinessConfigSchema()`

```ts
function resolveBusinessConfigSchema(
  schema: (
    | {
        default: string;
        description?: string;
        env?: ("paas" | "saas")[];
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
        env?: ("paas" | "saas")[];
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
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        options: OptionsFactory;
        selectionMode: "single";
        type: "dynamicList";
      }
    | {
        default?: MultipleDefaultFactory;
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        options: OptionsFactory;
        selectionMode: "multiple";
        type: "dynamicList";
      }
    | {
        default?: string;
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        type: "text";
      }
    | {
        default?: "";
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        type: "password";
      }
    | {
        default?: string;
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        type: "email";
      }
    | {
        default?: string;
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        type: "url";
      }
    | {
        default?: string;
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        type: "tel";
      }
    | {
        default?: boolean;
        description?: string;
        env?: ("paas" | "saas")[];
        label?: string;
        name: string;
        type: "boolean";
      }
  )[],
  params: RuntimeActionParams,
): Promise<ResolvedBusinessConfigSchema>;
```

Defined in: [modules/schema/utils.ts:121](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/modules/schema/utils.ts#L121)

Resolves any dynamic parts of a business configuration schema into a static
one suitable for validation, storage, and rendering.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `schema`  | ( \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `SingleDefaultFactory`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: `OptionsFactory`; `selectionMode`: `"single"`; `type`: `"dynamicList"`; \} \| \{ `default?`: `MultipleDefaultFactory`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: `OptionsFactory`; `selectionMode`: `"multiple"`; `type`: `"dynamicList"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `""`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \} \| \{ `default?`: `boolean`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"boolean"`; \})[] | Schema as the developer defined it; may contain `dynamicList` fields. |
| `params`  | `RuntimeActionParams`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Runtime action params forwarded to each `dynamicList` factory.        |

## Returns

`Promise`\<[`ResolvedBusinessConfigSchema`](../type-aliases/ResolvedBusinessConfigSchema.md)\>

A new, fully resolved schema. The input is not mutated.

## Throws

If a factory returns data that do not
match the expected schema shape.

## Example

```ts
const schema: BusinessConfigSchema = [
  {
    name: "paymentMethod",
    type: "dynamicList",
    selectionMode: "single",
    options: async (params) => fetchPaymentMethods(params.SOME_API_KEY),
    default: (opts) => opts[0].value,
  },
];

const resolved = await resolveBusinessConfigSchema(schema, params);
```
