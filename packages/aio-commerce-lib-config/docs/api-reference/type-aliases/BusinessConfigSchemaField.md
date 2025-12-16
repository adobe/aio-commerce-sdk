# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts:176](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-extensibility/source/config/schema/business-configuration.ts#L176)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, boolean, number, date, email, url, or phone.
