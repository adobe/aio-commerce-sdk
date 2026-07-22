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

Defined in: [config-manager.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/config-manager.ts#L65)

Options for initializing the configuration library with a schema that may require runtime resolution.
