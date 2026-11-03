# `KeyValueStore\<T\>`

```ts
type KeyValueStore<T> = {
  delete: (key: string) => Promise<boolean>;
  get: (key: string) => Promise<T | null>;
  has: (key: string) => Promise<boolean>;
  put: (key: string, data: T) => Promise<void>;
};
```

Defined in: [storage/types.ts:17](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L17)

Generic key-value store interface.

## Type Parameters

| Type Parameter                    | Description              |
| --------------------------------- | ------------------------ |
| <a id="type-parameter-t"></a> `T` | The type of data stored. |

## Properties

### delete

```ts
delete: (key: string) => Promise<boolean>;
```

Defined in: [storage/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L24)

Deletes data by key.

#### Parameters

| Parameter | Type     | Description        |
| --------- | -------- | ------------------ |
| `key`     | `string` | The key to delete. |

#### Returns

`Promise`\<`boolean`\>

True if the key existed and was deleted.

---

### get

```ts
get: (key: string) => Promise<T | null>;
```

Defined in: [storage/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L31)

Retrieves data by key.

#### Parameters

| Parameter | Type     | Description          |
| --------- | -------- | -------------------- |
| `key`     | `string` | The key to retrieve. |

#### Returns

`Promise`\<`T` \| `null`\>

The data or null if not found.

---

### has

```ts
has: (key: string) => Promise<boolean>;
```

Defined in: [storage/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L39)

Checks whether a value is stored under the key, even one `get` cannot read.

#### Parameters

| Parameter | Type     | Description       |
| --------- | -------- | ----------------- |
| `key`     | `string` | The key to check. |

#### Returns

`Promise`\<`boolean`\>

True if a value is stored under the key.

---

### put

```ts
put: (key: string, data: T) => Promise<void>;
```

Defined in: [storage/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L47)

Saves data with the given key.

#### Parameters

| Parameter | Type     | Description            |
| --------- | -------- | ---------------------- |
| `key`     | `string` | The key to save under. |
| `data`    | `T`      | The data to save.      |

#### Returns

`Promise`\<`void`\>
