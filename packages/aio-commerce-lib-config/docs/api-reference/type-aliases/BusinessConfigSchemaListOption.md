# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [modules/schema/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L43)

A single option in a `list` configuration field.
