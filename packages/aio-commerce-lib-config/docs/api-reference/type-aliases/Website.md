# `Website`

```ts
type Website = {
  code: string;
  default_group_id: number;
  extension_attributes?: Record<string, unknown>;
  id: number;
  name: string;
};
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L31)

Represents a website in Adobe Commerce.

## Properties

### code

```ts
code: string;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L37)

Unique code identifier for the website.

---

### default_group_id

```ts
default_group_id: number;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L39)

ID of the default store group for this website.

---

### extension_attributes?

```ts
optional extension_attributes: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L41)

Optional extension attributes for additional data.

---

### id

```ts
id: number;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L33)

Unique identifier for the website.

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-config/source/types/commerce.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/types/commerce.ts#L35)

Display name of the website.
