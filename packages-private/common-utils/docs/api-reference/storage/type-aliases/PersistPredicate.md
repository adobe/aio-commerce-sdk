# `PersistPredicate\<T\>`

```ts
type PersistPredicate<T> = (data: T) => boolean;
```

Defined in: [storage/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/common-utils/source/storage/types.ts#L52)

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
