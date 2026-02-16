# `StateStoreOptions`

```ts
type StateStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};
```

Defined in: [storage/types.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/types.ts#L58)

Options for creating a lib-state based store.

## Properties

### keyPrefix?

```ts
optional keyPrefix: string;
```

Defined in: [storage/types.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/types.ts#L60)

Key prefix for all entries.

---

### ttlSeconds?

```ts
optional ttlSeconds: number;
```

Defined in: [storage/types.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/types.ts#L62)

TTL in seconds for cached entries.
