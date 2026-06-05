# `BusinessConfigSchemaField`

```ts
type BusinessConfigSchemaField = Exclude<
  any[][number],
  {
    type: "dynamicList";
  }
>;
```

Defined in: [modules/schema/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/modules/schema/types.ts#L31)

A single static configuration field (one of: list, text, password, email, url, phone, boolean).
