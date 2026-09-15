# `InitializeOptions`

```ts
type InitializeOptions = InitializeBaseOptions & {
  schema?: any[];
};
```

Defined in: [config-manager.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-config/source/config-manager.ts#L59)

Options for initializing the configuration library with a static schema.

## Type Declaration

### schema?

```ts
optional schema?: any[];
```

Optional schema to use as the source of truth. If omitted, uses the previously-set one.
