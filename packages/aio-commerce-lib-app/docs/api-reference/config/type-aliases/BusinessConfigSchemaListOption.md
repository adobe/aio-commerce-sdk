# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [config/schema/business-configuration.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L195)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
