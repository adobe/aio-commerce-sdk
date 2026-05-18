# `PersistPredicate\<T\>`

```ts
type PersistPredicate<T> = (data: T) => boolean;
```

Defined in: [storage/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/storage/types.ts#L52)

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
