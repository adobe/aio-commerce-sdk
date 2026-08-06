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

Defined in: [config-manager.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/config-manager.ts#L65)

Options for initializing the configuration library with a schema that may require runtime resolution.
