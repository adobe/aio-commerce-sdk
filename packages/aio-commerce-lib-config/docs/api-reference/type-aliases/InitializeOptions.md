# `InitializeOptions`

```ts
type InitializeOptions = {
  schema?: any[];
};
```

Defined in: [config-manager.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-config/source/config-manager.ts#L41)

Options for initializing the configuration library, so that it works as expected.

## Properties

### schema?

```ts
optional schema: any[];
```

Defined in: [config-manager.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-config/source/config-manager.ts#L43)

Optional schema to use as the source of truth (latest version). If not provided, it will use the stored one (but only if it exists).
