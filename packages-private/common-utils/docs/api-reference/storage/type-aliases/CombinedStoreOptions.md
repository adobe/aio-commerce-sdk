# `CombinedStoreOptions\<T\>`

```ts
type CombinedStoreOptions<T> = {
  cache?: StateStoreOptions;
  persistent?: FilesStoreOptions & {
    shouldPersist?: PersistPredicate<T>;
  };
};
```

Defined in: [storage/types.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L83)

Options for creating a combined store.

## Type Parameters

| Type Parameter                    |
| --------------------------------- |
| <a id="type-parameter-t"></a> `T` |

## Properties

### cache?

```ts
cache?: StateStoreOptions;
```

Defined in: [storage/types.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L85)

Options for the cache (lib-state) store.

---

### persistent?

```ts
persistent?: FilesStoreOptions & {
  shouldPersist?: PersistPredicate<T>;
};
```

Defined in: [storage/types.ts:88](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L88)

Options for the persistent (lib-files) store.

#### Type Declaration

##### shouldPersist?

```ts
shouldPersist?: PersistPredicate<T>;
```

Predicate to determine if data should be persisted.
If not provided, all data is persisted.
