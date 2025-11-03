# `buildCommerceConfig()`

```ts
function buildCommerceConfig(
  params: CommerceConfigParams,
): CommerceHttpClientParams;
```

Defined in: [utils/commerce-config-validation.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/commerce-config-validation.ts#L143)

Builds Commerce configuration object from action parameters

## Parameters

| Parameter | Type                   | Description                                                |
| --------- | ---------------------- | ---------------------------------------------------------- |
| `params`  | `CommerceConfigParams` | Action parameters containing Commerce configuration values |

## Returns

[`CommerceHttpClientParams`](../interfaces/CommerceHttpClientParams.md)

Properly structured Commerce configuration for the library
