# `PaaSClientParams`

```ts
type PaaSClientParams = {
  auth:
    | IntegrationAuthProvider
    | IntegrationAuthParams
    | ImsAuthProvider
    | ImsAuthParamsWithOptionalScopes;
  config: CommerceHttpClientConfigPaaS;
  fetchOptions?: Options;
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L67)

Defines the configuration required to build an Adobe Commerce HTTP client for PaaS.

## Properties

### auth

```ts
auth:
  | IntegrationAuthProvider
  | IntegrationAuthParams
  | ImsAuthProvider
  | ImsAuthParamsWithOptionalScopes;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L68)

---

### config

```ts
config: CommerceHttpClientConfigPaaS;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L74)

---

### fetchOptions?

```ts
optional fetchOptions: Options;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L75)
