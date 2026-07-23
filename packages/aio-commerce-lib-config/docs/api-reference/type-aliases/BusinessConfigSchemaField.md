# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = Exclude<
  any[][number],
  {
    type: "dynamicList";
  }
>;
```

Defined in: [modules/schema/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L31)

A single static configuration field (one of: list, text, password, email, url, phone, boolean).
