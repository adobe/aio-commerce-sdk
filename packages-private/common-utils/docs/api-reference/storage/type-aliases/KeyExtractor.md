# `KeyExtractor()\<T\>`

```ts
type KeyExtractor<T> = (data: T) => string;
```

Defined in: [storage/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/storage/types.ts#L46)

Function to extract a key from data.
Used when saving data without explicitly providing a key.

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `data`    | `T`  |

## Returns

`string`
