# `ResolveCommerceHttpClientParamsOptions`

```ts
type ResolveCommerceHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:88](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L88)

Custom options to be taken into account when resolving Commerce HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
optional tryForwardAuthProvider?: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L93)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
