# `PersistPredicate\<T\>`

```ts
type PersistPredicate<T> = (data: T) => boolean;
```

Defined in: [storage/types.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L60)

Predicate function to determine if data should be persisted.
Used by combined stores to decide when to write to persistent storage.

## Type Parameters

| Type Parameter                    |
| --------------------------------- |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `data`    | `T`  |

## Returns

`boolean`
