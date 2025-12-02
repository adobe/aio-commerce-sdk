# `ConfigSchemaOption`

```ts
type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-config/source/modules/schema/schema.ts:190](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/modules/schema/schema.ts#L190)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
