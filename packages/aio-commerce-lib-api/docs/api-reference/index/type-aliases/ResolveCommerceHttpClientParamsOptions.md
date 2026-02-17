# `ResolveCommerceHttpClientParamsOptions`

```ts
type ResolveCommerceHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L82)

Custom options to be taken into account when resolving Commerce HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
optional tryForwardAuthProvider: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L87)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
