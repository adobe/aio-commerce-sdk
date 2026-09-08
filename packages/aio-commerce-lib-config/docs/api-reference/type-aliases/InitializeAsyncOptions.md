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

Defined in: [config-manager.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-config/source/config-manager.ts#L65)

Options for initializing the configuration library with a schema that may require runtime resolution.
