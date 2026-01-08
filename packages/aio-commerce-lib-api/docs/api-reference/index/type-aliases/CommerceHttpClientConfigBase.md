# `CommerceHttpClientConfigBase`

```ts
type CommerceHttpClientConfigBase = {
  baseUrl: string;
  storeViewCode?: string;
  version?: "V1";
};
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L22)

Defines the base configuration required to build an Adobe Commerce HTTP client.

## Properties

### baseUrl

```ts
baseUrl: string;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L24)

The base URL of the Commerce API.

---

### storeViewCode?

```ts
optional storeViewCode: string;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L30)

The store view code use to make requests to the Commerce API.

#### Default

```ts
"all";
```

---

### version?

```ts
optional version: "V1";
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L36)

The version of the Commerce API to use. Currently only `v1` is supported.

#### Default

```ts
"V1";
```
