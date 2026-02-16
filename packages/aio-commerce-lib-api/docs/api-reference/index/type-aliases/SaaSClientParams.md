# `SaaSClientParams`

```ts
type SaaSClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;
  config: CommerceHttpClientConfigSaaS;
  fetchOptions?: Options;
};
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L60)

Defines the configuration required to build an Adobe Commerce HTTP client for SaaS.

## Properties

### auth

```ts
auth:
  | ImsAuthProvider
  | ImsAuthParamsWithOptionalScopes;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L61)

---

### config

```ts
config: CommerceHttpClientConfigSaaS;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L62)

---

### fetchOptions?

```ts
optional fetchOptions: Options;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/types.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L63)
