# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [config/schema/business-configuration.ts:176](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L176)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, email, url, or phone.
