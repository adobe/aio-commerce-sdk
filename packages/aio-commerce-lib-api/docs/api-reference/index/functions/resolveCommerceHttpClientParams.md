# `resolveCommerceHttpClientParams()`

```ts
function resolveCommerceHttpClientParams(
  params: Record<string, unknown>,
): CommerceHttpClientParams;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/helpers.ts:225](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-api/source/lib/commerce/helpers.ts#L225)

Resolves the [CommerceHttpClientParams](../type-aliases/CommerceHttpClientParams.md) from the given App Builder action inputs.

## Parameters

| Parameter | Type                            | Description                                                                                                                |
| --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `Record`\<`string`, `unknown`\> | The App Builder action inputs to resolve the [CommerceHttpClientParams](../type-aliases/CommerceHttpClientParams.md) from. |

## Returns

[`CommerceHttpClientParams`](../type-aliases/CommerceHttpClientParams.md)

## Throws

If the base API URL or the authentication parameters cannot be resolved.

## Example

```typescript
import {
  resolveCommerceHttpClientParams,
  AdobeCommerceHttpClient,
} from "@adobe/aio-commerce-lib-api/commerce";

// Some App Builder runtime action that needs the Commerce HTTP client
export function main(params) {
  const commerceHttpClientParams = resolveCommerceHttpClientParams(params);
  const commerceClient = new AdobeCommerceHttpClient(commerceHttpClientParams);
}
```
