# `KeyExtractor\<T\>`

```ts
type KeyExtractor<T> = (data: T) => string;
```

Defined in: [storage/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L54)

Function to extract a key from data.
Used when saving data without explicitly providing a key.

## Type Parameters

| Type Parameter                    |
| --------------------------------- |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `data`    | `T`  |

## Returns

`string`
