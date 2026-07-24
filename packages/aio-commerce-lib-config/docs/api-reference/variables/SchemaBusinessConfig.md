# `SchemaBusinessConfig`

```ts
const SchemaBusinessConfig: ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<..., ...>, ObjectSchema<..., ...>], undefined>, VariantSchema<"selectionMode", [ObjectSchema<..., ...>, ObjectSchema<..., ...>], undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     env: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     type: LiteralSchema<..., ...>;
   }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
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
  })[], 1, "At least one configuration parameter is required">]>, readonly []>;
}, undefined>;
```

Defined in: [modules/schema/index.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/modules/schema/index.ts#L18)

The schema used to validate the business configuration settings.
