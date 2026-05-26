# `createFilesStore()`

```ts
function createFilesStore<T>(
  options?: FilesStoreOptions,
): Promise<KeyValueStore<T>>;
```

Defined in: [storage/files-store.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/storage/files-store.ts#L45)

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
