# `CommerceHttpClientConfigBase`

```ts
type CommerceHttpClientConfigBase = {
  baseUrl: string;
  storeViewCode?: string;
  version?: "V1";
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L23)

Defines the base configuration required to build an Adobe Commerce HTTP client.

## Properties

### baseUrl

```ts
baseUrl: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L25)

The base URL of the Commerce API.

---

### storeViewCode?

```ts
optional storeViewCode?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L31)

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

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L37)

The version of the Commerce API to use. Currently only `v1` is supported.

#### Default

```ts
"V1";
```
