# `CommerceHttpClientConfigBase`

```ts
type CommerceHttpClientConfigBase = {
  baseUrl: string;
  storeViewCode?: string;
  version?: "V1";
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L23)

Defines the base configuration required to build an Adobe Commerce HTTP client.

## Properties

### baseUrl

```ts
baseUrl: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L25)

The base URL of the Commerce API.

---

### storeViewCode?

```ts
optional storeViewCode?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L31)

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

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L37)

The version of the Commerce API to use. Currently only `v1` is supported.

#### Default

```ts
"V1";
```
