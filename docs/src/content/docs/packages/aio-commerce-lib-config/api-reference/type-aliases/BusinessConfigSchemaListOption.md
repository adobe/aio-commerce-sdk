---
title: "BusinessConfigSchemaListOption"
editUrl: false
prev: false
next: false
---

```ts
type BusinessConfigSchemaListOption = Extract<
  BusinessConfigSchemaField,
  {
    type: "list";
  }
>["options"][number];
```

Defined in: [modules/schema/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L50)

The schema type for an option in a list configuration field.
Represents a single option that can be selected in a list-type configuration field.
