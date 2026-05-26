# `ImsAuthProvider`

```ts
type ImsAuthProvider = {
  getAccessToken: () => Promise<string> | string;
  getHeaders: () => Promise<ImsAuthHeaders> | ImsAuthHeaders;
};
```

Defined in: [ims-auth/types.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-auth/source/lib/ims-auth/types.ts#L20)

Defines an authentication provider for Adobe IMS.

## Properties

### getAccessToken

```ts
getAccessToken: () => Promise<string> | string;
```

Defined in: [ims-auth/types.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-auth/source/lib/ims-auth/types.ts#L21)

#### Returns

`Promise`\<`string`\> \| `string`

---

### getHeaders

```ts
getHeaders: () =>
  | Promise<ImsAuthHeaders>
  | ImsAuthHeaders;
```

Defined in: [ims-auth/types.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-auth/source/lib/ims-auth/types.ts#L22)

#### Returns

\| `Promise`\<[`ImsAuthHeaders`](ImsAuthHeaders.md)\>
\| [`ImsAuthHeaders`](ImsAuthHeaders.md)
