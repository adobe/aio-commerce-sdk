# `ConfigSchemaField`

```ts
type ConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/schema/schema.ts:176](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/modules/schema/schema.ts#L176)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, boolean, number, date, email, url, or phone.
