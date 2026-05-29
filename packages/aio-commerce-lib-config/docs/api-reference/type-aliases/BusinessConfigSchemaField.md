# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = Exclude<
  any[][number],
  {
    type: "dynamicList";
  }
>;
```

Defined in: [modules/schema/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L31)

A single static configuration field (one of: list, text, password, email, url, phone, boolean).
