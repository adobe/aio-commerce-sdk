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

Defined in: [config-manager.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/config-manager.ts#L65)

Options for initializing the configuration library with a schema that may require runtime resolution.
