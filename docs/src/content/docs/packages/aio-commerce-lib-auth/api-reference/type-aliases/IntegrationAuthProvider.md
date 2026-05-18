---
title: "IntegrationAuthProvider"
editUrl: false
prev: false
next: false
---

```ts
type IntegrationAuthProvider = {
  getHeaders: (
    method: HttpMethodInput,
    url: AdobeCommerceUrl,
  ) => IntegrationAuthHeaders;
};
```

Defined in: [integration-auth/provider.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L32)

Defines an authentication provider for Adobe Commerce integrations.

## Properties

### getHeaders

```ts
getHeaders: (method: HttpMethodInput, url: AdobeCommerceUrl) =>
  IntegrationAuthHeaders;
```

Defined in: [integration-auth/provider.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L33)

#### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `method`  | `HttpMethodInput`  |
| `url`     | `AdobeCommerceUrl` |

#### Returns

`IntegrationAuthHeaders`
