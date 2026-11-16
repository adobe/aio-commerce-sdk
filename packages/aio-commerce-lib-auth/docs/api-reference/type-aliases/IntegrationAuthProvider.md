# `IntegrationAuthProvider`

```ts
type IntegrationAuthProvider = {
  getHeaders: (
    method: HttpMethodInput,
    url: AdobeCommerceUrl,
  ) => IntegrationAuthHeaders;
};
```

Defined in: [integration-auth/provider.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L32)

Defines an authentication provider for Adobe Commerce integrations.

## Properties

### getHeaders

```ts
getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) =>
  IntegrationAuthHeaders;
```

Defined in: [integration-auth/provider.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L33)

#### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `method`  | `HttpMethodInput`  |
| `url`     | `AdobeCommerceUrl` |

#### Returns

`IntegrationAuthHeaders`
