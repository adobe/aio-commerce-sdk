# `createStateStore()`

```ts
function createStateStore<T>(
  options?: StateStoreOptions,
): Promise<KeyValueStore<T>>;
```

Defined in: [storage/state-store.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/common-utils/source/storage/state-store.ts#L48)

Creates a generic key-value store backed by @adobe/aio-lib-state.
Provides fast, TTL-based caching for temporary data.

## Type Parameters

| Type Parameter | Description                |
| -------------- | -------------------------- |
| `T`            | The type of data to store. |

## Parameters

| Parameter | Type                                                        | Description                          |
| --------- | ----------------------------------------------------------- | ------------------------------------ |
| `options` | [`StateStoreOptions`](../type-aliases/StateStoreOptions.md) | Configuration options for the store. |

## Returns

`Promise`\<[`KeyValueStore`](../interfaces/KeyValueStore.md)\<`T`\>\>

A KeyValueStore implementation.

## Example

```typescript
interface UserSession {
  userId: string;
  token: string;
}

const store = await createStateStore<UserSession>({
  keyPrefix: "session",
  ttlSeconds: 3600, // 1 hour
});

await store.put("user-123", { userId: "123", token: "abc" });
const session = await store.get("user-123");
```
