# `BusinessConfigSchemaListOption`

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [modules/schema/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L50)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
