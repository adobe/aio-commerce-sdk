# `ImsAuthProvider`

```ts
type ImsAuthProvider = {
  getAccessToken: () => Promise<string>;
  getHeaders: () => Promise<ImsAuthHeaders>;
};
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L25)

Defines an authentication provider for Adobe IMS.

## Properties

### getAccessToken()

```ts
getAccessToken: () => Promise<string>;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L26)

#### Returns

`Promise`\<`string`\>

---

### getHeaders()

```ts
getHeaders: () => Promise<ImsAuthHeaders>;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L27)

#### Returns

`Promise`\<`ImsAuthHeaders`\>
