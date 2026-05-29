# `hasDynamicSchema()`

```ts
function hasDynamicSchema(
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
): boolean;
```

Defined in: [modules/schema/utils.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/modules/schema/utils.ts#L58)

Whether a business configuration schema contains any `dynamicList` fields
that need runtime resolution before use.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `schema`  | ( \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `SingleDefaultFactory`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: `OptionsFactory`; `selectionMode`: `"single"`; `type`: `"dynamicList"`; \} \| \{ `default?`: `MultipleDefaultFactory`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: `OptionsFactory`; `selectionMode`: `"multiple"`; `type`: `"dynamicList"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `""`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \} \| \{ `default?`: `boolean`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"boolean"`; \})[] | The schema to inspect. |

## Returns

`boolean`
