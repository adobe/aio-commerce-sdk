# `CombinedStoreOptions\<T\>`

```ts
type CombinedStoreOptions<T> = {
  cache?: StateStoreOptions;
  persistent?: FilesStoreOptions & {
    shouldPersist?: PersistPredicate<T>;
  };
};
```

Defined in: [storage/types.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/storage/types.ts#L75)

Options for creating a combined store.

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Properties

### cache?

```ts
optional cache?: StateStoreOptions;
```

Defined in: [storage/types.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/storage/types.ts#L77)

Options for the cache (lib-state) store.

---

### persistent?

```ts
optional persistent?: FilesStoreOptions & {
  shouldPersist?: PersistPredicate<T>;
};
```

Defined in: [storage/types.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/storage/types.ts#L80)

Options for the persistent (lib-files) store.

#### Type Declaration

##### shouldPersist?

```ts
optional shouldPersist?: PersistPredicate<T>;
```

Predicate to determine if data should be persisted.
If not provided, all data is persisted.
