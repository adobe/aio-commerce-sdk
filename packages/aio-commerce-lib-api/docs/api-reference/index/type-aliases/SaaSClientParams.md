# `SaaSClientParams`

```ts
type SaaSClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;
  config: CommerceHttpClientConfigSaaS;
  fetchOptions?: Options;
};
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L60)

Defines the configuration required to build an Adobe Commerce HTTP client for SaaS.

## Properties

### auth

```ts
auth:
  | ImsAuthProvider
  | ImsAuthParamsWithOptionalScopes;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L61)

---

### config

```ts
config: CommerceHttpClientConfigSaaS;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L62)

---

### fetchOptions?

```ts
optional fetchOptions: Options;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/commerce/types.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-api/source/lib/commerce/types.ts#L63)
