# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts#L195)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
