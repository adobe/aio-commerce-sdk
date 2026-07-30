# `ResolveCommerceHttpClientParamsOptions`

```ts
type ResolveCommerceHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:88](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L88)

Custom options to be taken into account when resolving Commerce HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
optional tryForwardAuthProvider?: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L93)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
