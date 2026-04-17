# `InitializeOptions`

```ts
type InitializeOptions = {
  libStateOptions?: LibStateOptions;
  schema?: any[];
};
```

Defined in: [config-manager.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/config-manager.ts#L45)

Options for initializing the configuration library, so that it works as expected.

## Properties

### libStateOptions?

```ts
optional libStateOptions: LibStateOptions;
```

Defined in: [config-manager.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/config-manager.ts#L50)

The options for initializing the Adobe State library (used for caching).

---

### schema?

```ts
optional schema: any[];
```

Defined in: [config-manager.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/config-manager.ts#L47)

Optional schema to use as the source of truth (latest version). If not provided, it will use the stored one (but only if it exists).
