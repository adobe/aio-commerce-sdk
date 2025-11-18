# `ConfigSchemaOption`

```ts
type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-config/source/modules/schema/schema.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/7a00f01d63dd49dc56fcae61314894f29322e96b/packages/aio-commerce-lib-config/source/modules/schema/schema.ts#L41)

The schema for an option for a list configuration field.
