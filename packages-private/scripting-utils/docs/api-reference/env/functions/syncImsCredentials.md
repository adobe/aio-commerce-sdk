# `syncImsCredentials()`

```ts
function syncImsCredentials(): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/env.ts#L116)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
