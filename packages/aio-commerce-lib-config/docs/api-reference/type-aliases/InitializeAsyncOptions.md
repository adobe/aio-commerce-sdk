# `InitializeAsyncOptions`

```ts
type InitializeAsyncOptions = InitializeBaseOptions &
  (
    | {
        params: RuntimeActionParams;
        schema: any[];
      }
    | {
        params?: undefined;
        schema?: undefined;
      }
  );
```

Defined in: [config-manager.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-config/source/config-manager.ts#L65)

Options for initializing the configuration library with a schema that may require runtime resolution.
