# `RecordedSchemaBusinessConfig`

```ts
const RecordedSchemaBusinessConfig: ObjectSchema<{
  schema: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<VariantSchema<"type", [VariantSchema<"selectionMode", [ObjectSchema<..., ...>, ObjectSchema<..., ...>], undefined>, VariantSchema<"selectionMode", [... & ..., ... & ...], undefined>, ObjectSchema<{
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
   }
     | {
     default?: SingleDefaultFactory;
     description?: string;
     env?: ...[];
     label?: string;
     name: string;
     options?: OptionsFactory;
     selectionMode: "single";
     type: "dynamicList";
   }
     | {
     default?: MultipleDefaultFactory;
     description?: string;
     env?: ...[];
     label?: string;
     name: string;
     options?: OptionsFactory;
     selectionMode: "multiple";
     type: "dynamicList";
  })[], 1, "At least one configuration parameter is required">]>, readonly []>;
}, undefined>;
```

Defined in: [modules/schema/index.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-config/source/modules/schema/index.ts#L33)

The schema used to validate business configuration settings recovered from
a persisted lifecycle snapshot, where `dynamicList` fields may be missing
their `options`/`default` functions.
