# `createFilesStore()`

```ts
function createFilesStore<T>(
  options?: FilesStoreOptions,
): Promise<KeyValueStore<T>>;
```

Defined in: [storage/files-store.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/storage/files-store.ts#L45)

Creates a generic key-value store backed by @adobe/aio-lib-files.
Provides persistent storage that survives beyond TTL.

## Type Parameters

| Type Parameter | Description                |
| -------------- | -------------------------- |
| `T`            | The type of data to store. |

## Parameters

| Parameter | Type                                                        | Description                          |
| --------- | ----------------------------------------------------------- | ------------------------------------ |
| `options` | [`FilesStoreOptions`](../type-aliases/FilesStoreOptions.md) | Configuration options for the store. |

## Returns

`Promise`\<[`KeyValueStore`](../interfaces/KeyValueStore.md)\<`T`\>\>

A KeyValueStore implementation.

## Example

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const store = await createFilesStore<UserProfile>({
  dirPrefix: "profiles",
});

await store.put("user-123", {
  id: "123",
  name: "John",
  email: "john@example.com",
});
const profile = await store.get("user-123");
```
