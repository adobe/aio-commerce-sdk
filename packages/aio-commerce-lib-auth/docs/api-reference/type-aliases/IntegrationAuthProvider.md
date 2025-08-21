# `IntegrationAuthProvider`

```ts
type IntegrationAuthProvider = {
  getHeaders: (
    method: HttpMethodInput,
    url: AdobeCommerceUrl,
  ) => IntegrationAuthHeaders;
};
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L33)

Defines an authentication provider for Adobe Commerce integrations.

## Properties

### getHeaders()

```ts
getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) =>
  IntegrationAuthHeaders;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L34)

#### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `method`  | `HttpMethodInput`  |
| `url`     | `AdobeCommerceUrl` |

#### Returns

`IntegrationAuthHeaders`
