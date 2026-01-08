# `SchemaBusinessConfig`

```ts
type SchemaBusinessConfig = ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<..., ...>, ObjectSchema<..., ...>], undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     type: LiteralSchema<..., ...>;
   }, undefined>], undefined>, "Expected an array of configuration fields">, MinLengthAction<(
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
  })[], 1, "At least one configuration parameter is required">]>, readonly []>;
}, undefined>;
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts:210](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts#L210)

The schema used to validate the `businessConfig` settings in the extensibility config file.
