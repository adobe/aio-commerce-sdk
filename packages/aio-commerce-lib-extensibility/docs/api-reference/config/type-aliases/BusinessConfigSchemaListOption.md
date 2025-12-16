# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts#L195)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
