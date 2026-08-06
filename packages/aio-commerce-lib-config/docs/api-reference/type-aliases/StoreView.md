# `StoreView`

```ts
type StoreView = {
  code: string;
  extension_attributes?: Record<string, unknown>;
  id: number;
  is_active: boolean;
  name: string;
  store_group_id: number;
  website_id: number;
};
```

Defined in: [types/commerce.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L67)

Represents a store view in Adobe Commerce.

## Properties

### code

```ts
code: string;
```

Defined in: [types/commerce.ts:71](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L71)

Unique code identifier for the store view.

---

### extension\_attributes?

```ts
optional extension_attributes?: Record<string, unknown>;
```

Defined in: [types/commerce.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L81)

Optional extension attributes for additional data.

---

### id

```ts
id: number;
```

Defined in: [types/commerce.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L69)

Unique identifier for the store view.

---

### is\_active

```ts
is_active: boolean;
```

Defined in: [types/commerce.ts:79](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L79)

Whether the store view is currently active.

---

### name

```ts
name: string;
```

Defined in: [types/commerce.ts:73](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L73)

Display name of the store view.

---

### store\_group\_id

```ts
store_group_id: number;
```

Defined in: [types/commerce.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L77)

ID of the parent store group.

---

### website\_id

```ts
website_id: number;
```

Defined in: [types/commerce.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-config/source/types/commerce.ts#L75)

ID of the parent website.
