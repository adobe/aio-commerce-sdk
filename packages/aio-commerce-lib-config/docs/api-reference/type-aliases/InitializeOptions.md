# `InitializeOptions`

```ts
type InitializeOptions = InitializeBaseOptions & {
  schema?: any[];
};
```

Defined in: [config-manager.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-config/source/config-manager.ts#L59)

Options for initializing the configuration library with a static schema.

## Type Declaration

### schema?

```ts
optional schema?: any[];
```

Optional schema to use as the source of truth. If omitted, uses the previously-set one.
