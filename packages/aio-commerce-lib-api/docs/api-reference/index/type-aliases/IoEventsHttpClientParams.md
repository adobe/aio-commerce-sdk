# `IoEventsHttpClientParams`

```ts
type IoEventsHttpClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;
  config?: IoEventsHttpClientConfig;
  fetchOptions?: Options;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L33)

Defines the parameters required to build an HTTP client for the Adobe I/O Events API.

## Properties

### auth

```ts
auth:
  | ImsAuthProvider
  | ImsAuthParamsWithOptionalScopes;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L35)

The IMS authentication parameters.

---

### config?

```ts
optional config?: IoEventsHttpClientConfig;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L40)

The configuration for the I/O Events HTTP client.

---

### fetchOptions?

```ts
optional fetchOptions?: Options;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L43)

Additional fetch options to use for the I/O Events HTTP requests.
