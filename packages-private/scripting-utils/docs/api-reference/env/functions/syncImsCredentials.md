# `syncImsCredentials()`

```ts
function syncImsCredentials(): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:117](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages-private/scripting-utils/source/env.ts#L117)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
