# `syncImsCredentials()`

```ts
function syncImsCredentials(): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/scripting-utils/source/env.ts#L116)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
