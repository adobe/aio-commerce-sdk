# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [config/schema/business-configuration.ts:179](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L179)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, email, url, or phone.
