# `AdminUiPermissionClientOptions`

```ts
type AdminUiPermissionClientOptions = {
  appId?: string;
  cacheTtlMs?: number;
  denyOnError?: boolean;
  httpClient: AdobeCommerceHttpClient;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L27)

Options used to create an Admin UI SDK permission client.

## Properties

### appId?

```ts
optional appId?: string;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L29)

The application's `metadata.id` value. When provided, `check()` and `require()` can be called with no resource argument.

---

### cacheTtlMs?

```ts
optional cacheTtlMs?: number;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L35)

Milliseconds to cache a permission result. Default: 300_000 (5 minutes).
Set to 0 to disable result caching. Note: in-flight deduplication of concurrent identical
requests is independent of this setting and remains active even when caching is disabled.

---

### denyOnError?

```ts
optional denyOnError?: boolean;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L37)

Return false instead of throwing when a network or parse error occurs. Default: true.

---

### httpClient

```ts
httpClient: AdobeCommerceHttpClient;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L39)

Commerce HTTP client used to call the Admin UI SDK permission endpoint.
