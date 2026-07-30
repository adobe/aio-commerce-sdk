# `syncImsCredentials()`

```ts
function syncImsCredentials(): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages-private/scripting-utils/source/env.ts#L116)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
