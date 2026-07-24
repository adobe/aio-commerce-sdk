# `CommerceHttpClientConfigBase`

```ts
type CommerceHttpClientConfigBase = {
  baseUrl: string;
  storeViewCode?: string;
  version?: "V1";
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L23)

Defines the base configuration required to build an Adobe Commerce HTTP client.

## Properties

### baseUrl

```ts
baseUrl: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L25)

The base URL of the Commerce API.

---

### storeViewCode?

```ts
optional storeViewCode?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L31)

The store view code use to make requests to the Commerce API.

#### Default

```ts
"all";
```

---

### version?

```ts
optional version?: "V1";
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L37)

The version of the Commerce API to use. Currently only `v1` is supported.

#### Default

```ts
"V1";
```
