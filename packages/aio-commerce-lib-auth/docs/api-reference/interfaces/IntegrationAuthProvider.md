# `IntegrationAuthProvider`

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/5809dd20a9a3622ccefb4f7ffee3f04a460f0d98/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L33)

Defines an authentication provider for Adobe Commerce integrations.

## Properties

### getHeaders()

```ts
getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) =>
  IntegrationAuthHeaders;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/5809dd20a9a3622ccefb4f7ffee3f04a460f0d98/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L34)

#### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `method`  | `HttpMethodInput`  |
| `url`     | `AdobeCommerceUrl` |

#### Returns

`IntegrationAuthHeaders`
