# `SchemaBusinessConfig`

```ts
const SchemaBusinessConfig: ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<..., ...>, ObjectSchema<..., ...>], undefined>, ObjectSchema<{
     default: OptionalSchema<..., ...>;
     description: OptionalSchema<..., ...>;
     env: OptionalSchema<..., ...>;
     label: OptionalSchema<..., ...>;
     name: SchemaWithPipe<...>;
     type: LiteralSchema<..., ...>;
   }, undefined>, ObjectSchema<{
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

Defined in: [modules/schema/index.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-config/source/modules/schema/index.ts#L18)

The schema used to validate the the business configuration settings.
