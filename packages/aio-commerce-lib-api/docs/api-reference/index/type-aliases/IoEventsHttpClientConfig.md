# `IoEventsHttpClientConfig`

```ts
type IoEventsHttpClientConfig = {
  baseUrl?: string;
  ingressBaseUrl?: string;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L18)

Defines the configuration required to build an Adobe I/O HTTP client.

## Properties

### baseUrl?

```ts
optional baseUrl?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L23)

The base URL to use for the Adobe I/O Events API.

#### Default

```ts
"https://api.adobe.io/events";
```

---

### ingressBaseUrl?

```ts
optional ingressBaseUrl?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L29)

The base URL to use for the Adobe I/O Events ingress endpoint.

#### Default

```ts
"https://eventsingress.adobe.io/";
```
