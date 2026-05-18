---
title: "BusinessConfigSchemaField"
editUrl: false
prev: false
next: false
---

```ts
type BusinessConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [modules/schema/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L31)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, email, url, phone, or boolean.
