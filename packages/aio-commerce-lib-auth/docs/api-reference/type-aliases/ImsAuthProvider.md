# `ImsAuthProvider`

```ts
type ImsAuthProvider = {
  getAccessToken: () => Promise<string>;
  getHeaders: () => Promise<ImsAuthHeaders>;
};
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L29)

Defines an authentication provider for Adobe IMS.

## Properties

### getAccessToken()

```ts
getAccessToken: () => Promise<string>;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L30)

#### Returns

`Promise`\<`string`\>

---

### getHeaders()

```ts
getHeaders: () => Promise<ImsAuthHeaders>;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L31)

#### Returns

`Promise`\<`ImsAuthHeaders`\>
