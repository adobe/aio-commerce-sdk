# `IntegrationAuthProvider`

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/2e9631ab3482e2ba9d40c8de9e8d2373edc2e3ed/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L33)

Defines an authentication provider for Adobe Commerce integrations.

## Properties

### getHeaders()

```ts
getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) =>
  IntegrationAuthHeaders;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/2e9631ab3482e2ba9d40c8de9e8d2373edc2e3ed/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L34)

#### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `method`  | `HttpMethodInput`  |
| `url`     | `AdobeCommerceUrl` |

#### Returns

`IntegrationAuthHeaders`
