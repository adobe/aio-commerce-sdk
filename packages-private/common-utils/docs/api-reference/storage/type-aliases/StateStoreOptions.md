# `StateStoreOptions`

```ts
type StateStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};
```

Defined in: [storage/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L57)

Options for creating a lib-state based store.

## Properties

### keyPrefix?

```ts
optional keyPrefix: string;
```

Defined in: [storage/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L59)

Key prefix for all entries.

---

### ttlSeconds?

```ts
optional ttlSeconds: number;
```

Defined in: [storage/types.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L61)

TTL in seconds for cached entries.
