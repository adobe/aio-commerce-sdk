# `InitializeOptions`

```ts
type InitializeOptions = InitializeBaseOptions & {
  schema?: any[];
};
```

Defined in: [config-manager.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-config/source/config-manager.ts#L59)

Options for initializing the configuration library with a static schema.

## Type Declaration

### schema?

```ts
schema?: any[];
```

Optional schema to use as the source of truth. If omitted, uses the previously-set one.
