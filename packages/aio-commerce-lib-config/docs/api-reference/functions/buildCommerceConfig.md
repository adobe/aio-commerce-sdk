# `buildCommerceConfig()`

```ts
function buildCommerceConfig(
  params: CommerceConfigParams,
): CommerceHttpClientParams;
```

Defined in: [utils/commerce-config-validation.ts:156](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/commerce-config-validation.ts#L156)

Builds Commerce configuration object from action parameters

## Parameters

| Parameter | Type                   | Description                                                |
| --------- | ---------------------- | ---------------------------------------------------------- |
| `params`  | `CommerceConfigParams` | Action parameters containing Commerce configuration values |

## Returns

`CommerceHttpClientParams`

Properly structured Commerce configuration for the library
