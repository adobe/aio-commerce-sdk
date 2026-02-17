# `CombinedStoreOptions\<T\>`

```ts
type CombinedStoreOptions<T> = {
  cache?: StateStoreOptions;
  persistent?: FilesStoreOptions & {
    shouldPersist?: PersistPredicate<T>;
  };
};
```

Defined in: [storage/types.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/types.ts#L76)

Options for creating a combined store.

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Properties

### cache?

```ts
optional cache: StateStoreOptions;
```

Defined in: [storage/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/types.ts#L78)

Options for the cache (lib-state) store.

---

### persistent?

```ts
optional persistent: FilesStoreOptions & {
  shouldPersist?: PersistPredicate<T>;
};
```

Defined in: [storage/types.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/types.ts#L81)

Options for the persistent (lib-files) store.

#### Type Declaration

##### shouldPersist?

```ts
optional shouldPersist: PersistPredicate<T>;
```

Predicate to determine if data should be persisted.
If not provided, all data is persisted.
