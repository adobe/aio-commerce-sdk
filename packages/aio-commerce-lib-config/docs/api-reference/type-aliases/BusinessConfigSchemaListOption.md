# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L195)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
