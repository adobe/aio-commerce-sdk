# `resolveCommerceHttpClientParams()`

```ts
function resolveCommerceHttpClientParams(
  params: Record<string, unknown>,
  options?: ResolveCommerceHttpClientParamsOptions,
): CommerceHttpClientParams;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/helpers.ts:234](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/commerce/helpers.ts#L234)

Resolves the [CommerceHttpClientParams](../type-aliases/CommerceHttpClientParams.md) from the given App Builder action inputs.

## Parameters

| Parameter  | Type                                                                                                  | Description                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `params`   | `Record`\<`string`, `unknown`\>                                                                       | The App Builder action inputs to resolve the [CommerceHttpClientParams](../type-aliases/CommerceHttpClientParams.md) from. |
| `options?` | [`ResolveCommerceHttpClientParamsOptions`](../type-aliases/ResolveCommerceHttpClientParamsOptions.md) | -                                                                                                                          |

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
