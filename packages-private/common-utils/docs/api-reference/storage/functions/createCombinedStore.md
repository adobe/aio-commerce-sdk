# `createCombinedStore()`

```ts
function createCombinedStore<T>(
  options?: CombinedStoreOptions<T>,
): Promise<KeyValueStore<T>>;
```

Defined in: [storage/combined-store.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/common-utils/source/storage/combined-store.ts#L57)

Creates a combined key-value store that uses:

- lib-state for fast cache during active operations
- lib-files for persistent storage

Read strategy: cache first, then persistent storage
Write strategy:

- Always write to cache for fast reads
- Write to persistent storage based on shouldPersist predicate

## Type Parameters

| Type Parameter | Description                |
| -------------- | -------------------------- |
| `T`            | The type of data to store. |

## Parameters

| Parameter | Type                                                                     | Description                           |
| --------- | ------------------------------------------------------------------------ | ------------------------------------- |
| `options` | [`CombinedStoreOptions`](../type-aliases/CombinedStoreOptions.md)\<`T`\> | Configuration options for the stores. |

## Returns

`Promise`\<[`KeyValueStore`](../interfaces/KeyValueStore.md)\<`T`\>\>

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
