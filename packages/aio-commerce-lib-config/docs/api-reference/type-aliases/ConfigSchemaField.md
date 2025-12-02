# `ConfigSchemaField`

```ts
type ConfigSchemaField = v.InferInput<typeof FieldSchema>;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/schema/schema.ts:176](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/modules/schema/schema.ts#L176)

The schema type for a configuration field.

Represents a single field definition in the configuration schema, which can be
one of various types: list, text, password, boolean, number, date, email, url, or phone.
