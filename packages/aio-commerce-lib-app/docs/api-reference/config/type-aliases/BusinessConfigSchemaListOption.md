# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L195)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
