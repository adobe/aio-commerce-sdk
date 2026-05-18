# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [modules/schema/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L31)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, email, url, phone, or boolean.
