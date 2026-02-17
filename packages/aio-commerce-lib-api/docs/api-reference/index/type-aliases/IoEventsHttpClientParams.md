# `IoEventsHttpClientParams`

```ts
type IoEventsHttpClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;
  config?: IoEventsHttpClientConfig;
  fetchOptions?: Options;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L27)

Defines the parameters required to build an HTTP client for the Adobe I/O Events API.

## Properties

### auth

```ts
auth:
  | ImsAuthProvider
  | ImsAuthParamsWithOptionalScopes;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L29)

The IMS authentication parameters.

---

### config?

```ts
optional config: IoEventsHttpClientConfig;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L34)

The configuration for the I/O Events HTTP client.

---

### fetchOptions?

```ts
optional fetchOptions: Options;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L37)

Additional fetch options to use for the I/O Events HTTP requests.
