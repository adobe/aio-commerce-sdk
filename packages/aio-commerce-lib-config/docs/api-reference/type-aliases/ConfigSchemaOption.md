# `ConfigSchemaOption`

```ts
type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-config/source/modules/schema/schema.ts:190](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/modules/schema/schema.ts#L190)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
