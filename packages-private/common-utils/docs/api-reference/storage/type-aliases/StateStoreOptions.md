# `StateStoreOptions`

```ts
type StateStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};
```

Defined in: [storage/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/storage/types.ts#L57)

Options for creating a lib-state based store.

## Properties

### keyPrefix?

```ts
optional keyPrefix: string;
```

Defined in: [storage/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/storage/types.ts#L59)

Key prefix for all entries.

---

### ttlSeconds?

```ts
optional ttlSeconds: number;
```

Defined in: [storage/types.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/storage/types.ts#L61)

TTL in seconds for cached entries.
