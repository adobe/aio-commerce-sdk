# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = Exclude<
  any[][number],
  {
    type: "dynamicList";
  }
>;
```

Defined in: [modules/schema/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L31)

A single static configuration field (one of: list, text, password, email, url, phone, boolean).
