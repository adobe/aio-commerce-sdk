# `IoEventsHttpClientConfig`

```ts
type IoEventsHttpClientConfig = {
  baseUrl?: string;
  ingressBaseUrl?: string;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L18)

Defines the configuration required to build an Adobe I/O HTTP client.

## Properties

### baseUrl?

```ts
optional baseUrl?: string;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L23)

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

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L29)

The base URL to use for the Adobe I/O Events ingress endpoint.

#### Default

```ts
"https://eventsingress.adobe.io/";
```
