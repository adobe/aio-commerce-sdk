# `InitializeAsyncOptions`

```ts
type InitializeAsyncOptions = InitializeBaseOptions &
  | {
  params: RuntimeActionParams;
  schema: any[];
}
  | {
  params?: undefined;
  schema?: undefined;
};
```

Defined in: [config-manager.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/config-manager.ts#L65)

Options for initializing the configuration library with a schema that may require runtime resolution.
