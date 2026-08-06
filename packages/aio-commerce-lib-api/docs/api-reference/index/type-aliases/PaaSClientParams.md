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

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:73](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L73)

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

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L74)

---

### config

```ts
config: CommerceHttpClientConfigPaaS;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L80)

---

### fetchOptions?

```ts
optional fetchOptions?: Options;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L81)
