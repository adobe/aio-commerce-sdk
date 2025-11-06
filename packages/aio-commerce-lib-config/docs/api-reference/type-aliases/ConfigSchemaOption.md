# `ConfigSchemaOption`

```ts
type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-config/source/modules/schema/types.ts:17](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L17)
