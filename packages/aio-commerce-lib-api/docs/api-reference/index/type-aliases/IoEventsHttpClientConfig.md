# `IoEventsHttpClientConfig`

```ts
type IoEventsHttpClientConfig = {
  baseUrl?: string;
  ingressBaseUrl?: string;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L18)

Defines the configuration required to build an Adobe I/O HTTP client.

## Properties

### baseUrl?

```ts
baseUrl?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L23)

The base URL to use for the Adobe I/O Events API.

#### Default

```ts
"https://api.adobe.io/events";
```

---

### ingressBaseUrl?

```ts
ingressBaseUrl?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L29)

The base URL to use for the Adobe I/O Events ingress endpoint.

#### Default

```ts
"https://eventsingress.adobe.io/";
```
