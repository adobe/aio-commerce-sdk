# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:198](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L198)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
