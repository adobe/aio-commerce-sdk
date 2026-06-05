# `initialize()`

## Call Signature

```ts
function initialize(options: InitializeOptions): InitializeResult;
```

Defined in: [config-manager.ts:113](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/config-manager.ts#L113)

Initializes the configuration library so that it works as expected.

The schema is stored in global memory. If a schema is provided, it will be set.
If no schema is provided, initialization will succeed only if a schema was previously set globally.

### Parameters

| Parameter | Type                                                        | Description                                         |
| --------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `options` | [`InitializeOptions`](../type-aliases/InitializeOptions.md) | Options for initializing the configuration library. |

### Returns

[`InitializeResult`](../type-aliases/InitializeResult.md)

## Call Signature

```ts
function initialize(
  options: InitializeBaseOptions & {
    params: RuntimeActionParams;
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
    )[];
  },
): Promise<InitializeResult>;
```

Defined in: [config-manager.ts:114](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/config-manager.ts#L114)

Initializes the configuration library so that it works as expected.

The schema is stored in global memory. If a schema is provided, it will be set.
If no schema is provided, initialization will succeed only if a schema was previously set globally.

### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Description                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `options` | `InitializeBaseOptions` & \{ `params`: `RuntimeActionParams`; `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default?`: `string`[]; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default`: `SingleDefaultFactory`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: `OptionsFactory`; `selectionMode`: `"single"`; `type`: `"dynamicList"`; \} \| \{ `default?`: `MultipleDefaultFactory`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `options`: `OptionsFactory`; `selectionMode`: `"multiple"`; `type`: `"dynamicList"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `""`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \} \| \{ `default?`: `boolean`; `description?`: `string`; `env?`: (`"paas"` \| `"saas"`)[]; `label?`: `string`; `name`: `string`; `type`: `"boolean"`; \})[]; \} | Options for initializing the configuration library. |

### Returns

`Promise`\<[`InitializeResult`](../type-aliases/InitializeResult.md)\>
