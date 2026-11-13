# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = Exclude<
  any[][number],
  {
    type: "dynamicList";
  }
>;
```

Defined in: [modules/schema/types.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L22)

A single static configuration field (one of: list, text, password, email, url, phone, boolean).
