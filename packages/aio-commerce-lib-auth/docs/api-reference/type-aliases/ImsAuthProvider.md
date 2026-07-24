# `ImsAuthProvider`

```ts
type ImsAuthProvider = {
  getAccessToken: () => Promise<string> | string;
  getHeaders: () => Promise<ImsAuthHeaders> | ImsAuthHeaders;
};
```

Defined in: [ims-auth/types.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-auth/source/lib/ims-auth/types.ts#L20)

Defines an authentication provider for Adobe IMS.

## Properties

### getAccessToken

```ts
getAccessToken: () => Promise<string> | string;
```

Defined in: [ims-auth/types.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-auth/source/lib/ims-auth/types.ts#L21)

#### Returns

`Promise`\<`string`\> \| `string`

---

### getHeaders

```ts
getHeaders: () =>
  | Promise<ImsAuthHeaders>
  | ImsAuthHeaders;
```

Defined in: [ims-auth/types.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-auth/source/lib/ims-auth/types.ts#L22)

#### Returns

\| `Promise`\<[`ImsAuthHeaders`](ImsAuthHeaders.md)\>
\| [`ImsAuthHeaders`](ImsAuthHeaders.md)
