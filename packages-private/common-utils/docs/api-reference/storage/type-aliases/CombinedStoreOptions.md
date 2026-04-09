# `CombinedStoreOptions\<T\>`

```ts
type CombinedStoreOptions<T> = {
  cache?: StateStoreOptions;
  persistent?: FilesStoreOptions & {
    shouldPersist?: PersistPredicate<T>;
  };
};
```

Defined in: [storage/types.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L75)

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

Defined in: [storage/types.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L77)

Options for the cache (lib-state) store.

---

### persistent?

```ts
optional persistent: FilesStoreOptions & {
  shouldPersist?: PersistPredicate<T>;
};
```

Defined in: [storage/types.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L80)

Options for the persistent (lib-files) store.

#### Type Declaration

##### shouldPersist?

```ts
optional shouldPersist: PersistPredicate<T>;
```

Predicate to determine if data should be persisted.
If not provided, all data is persisted.
