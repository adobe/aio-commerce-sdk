# `StoreGroup`

```ts
type StoreGroup = {
  code: string;
  default_store_id: number;
  extension_attributes?: Record<string, unknown>;
  id: number;
  name: string;
  root_category_id: number;
  website_id: number;
};
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L47)

Represents a store group in Adobe Commerce.

## Properties

### code

```ts
code: string;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L59)

Unique code identifier for the store group.

---

### default_store_id

```ts
default_store_id: number;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L55)

ID of the default store for this store group.

---

### extension_attributes?

```ts
optional extension_attributes: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L61)

Optional extension attributes for additional data.

---

### id

```ts
id: number;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L49)

Unique identifier for the store group.

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L57)

Display name of the store group.

---

### root_category_id

```ts
root_category_id: number;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L53)

Root category ID for this store group.

---

### website_id

```ts
website_id: number;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L51)

ID of the parent website.
