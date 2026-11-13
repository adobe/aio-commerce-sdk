# `createCombinedStore()`

```ts
function createCombinedStore<T>(
  options?: CombinedStoreOptions<T>,
): Promise<KeyValueStore<T>>;
```

Defined in: [storage/combined-store.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/combined-store.ts#L57)

Creates a combined key-value store that uses:

- lib-state for fast cache during active operations
- lib-files for persistent storage

Read strategy: cache first, then persistent storage
Write strategy:

- Write to persistent storage first, based on the shouldPersist predicate. A failed write leaves both stores unchanged.
- Then write to cache for fast reads, dropping the cached value if that write fails

## Type Parameters

| Type Parameter                    | Description                |
| --------------------------------- | -------------------------- |
| <a id="type-parameter-t"></a> `T` | The type of data to store. |

## Parameters

| Parameter  | Type                                                                     | Description                           |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------- |
| `options?` | [`CombinedStoreOptions`](../type-aliases/CombinedStoreOptions.md)\<`T`\> | Configuration options for the stores. |

## Returns

`Promise`\<[`KeyValueStore`](../type-aliases/KeyValueStore.md)\<`T`\>\>

## Example

```typescript
interface Task {
  id: string;
  status: "pending" | "completed";
  result?: unknown;
}

const store = await createCombinedStore<Task>({
  cache: { keyPrefix: "task", ttlSeconds: 600 },
  persistent: {
    dirPrefix: "tasks",
    shouldPersist: (task) => task.status === "completed",
  },
});

// During processing: writes to cache only
await store.put("task-1", { id: "1", status: "pending" });

// On completion (as shouldPersist indicates): writes to both cache and persistent
await store.put("task-1", { id: "1", status: "completed", result: {} });
```
