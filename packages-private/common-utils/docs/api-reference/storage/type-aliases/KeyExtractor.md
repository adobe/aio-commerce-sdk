# `KeyExtractor\<T\>`

```ts
type KeyExtractor<T> = (data: T) => string;
```

Defined in: [storage/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages-private/common-utils/source/storage/types.ts#L46)

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
