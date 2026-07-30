# `IoEventsHttpClientParams`

```ts
type IoEventsHttpClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;
  config?: IoEventsHttpClientConfig;
  fetchOptions?: Options;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L33)

Defines the parameters required to build an HTTP client for the Adobe I/O Events API.

## Properties

### auth

```ts
auth:
  | ImsAuthProvider
  | ImsAuthParamsWithOptionalScopes;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L35)

The IMS authentication parameters.

---

### config?

```ts
optional config?: IoEventsHttpClientConfig;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L40)

The configuration for the I/O Events HTTP client.

---

### fetchOptions?

```ts
optional fetchOptions?: Options;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L43)

Additional fetch options to use for the I/O Events HTTP requests.
