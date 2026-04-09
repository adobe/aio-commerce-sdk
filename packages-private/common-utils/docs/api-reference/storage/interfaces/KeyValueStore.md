# `KeyValueStore\<T\>`

Defined in: [storage/types.ts:17](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L17)

Generic key-value store interface.

## Type Parameters

| Type Parameter | Description              |
| -------------- | ------------------------ |
| `T`            | The type of data stored. |

## Methods

### delete()

```ts
delete(key: string): Promise<boolean>;
```

Defined in: [storage/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L24)

Deletes data by key.

#### Parameters

| Parameter | Type     | Description        |
| --------- | -------- | ------------------ |
| `key`     | `string` | The key to delete. |

#### Returns

`Promise`\<`boolean`\>

True if the key existed and was deleted.

---

### get()

```ts
get(key: string): Promise<T | null>;
```

Defined in: [storage/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L31)

Retrieves data by key.

#### Parameters

| Parameter | Type     | Description          |
| --------- | -------- | -------------------- |
| `key`     | `string` | The key to retrieve. |

#### Returns

`Promise`\<`T` \| `null`\>

The data or null if not found.

---

### put()

```ts
put(key: string, data: T): Promise<void>;
```

Defined in: [storage/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/common-utils/source/storage/types.ts#L39)

Saves data with the given key.

#### Parameters

| Parameter | Type     | Description            |
| --------- | -------- | ---------------------- |
| `key`     | `string` | The key to save under. |
| `data`    | `T`      | The data to save.      |

#### Returns

`Promise`\<`void`\>
