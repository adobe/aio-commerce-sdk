# `PersistPredicate()\<T\>`

```ts
type PersistPredicate<T> = (data: T) => boolean;
```

Defined in: [storage/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/common-utils/source/storage/types.ts#L53)

Predicate function to determine if data should be persisted.
Used by combined stores to decide when to write to persistent storage.

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `data`    | `T`  |

## Returns

`boolean`
