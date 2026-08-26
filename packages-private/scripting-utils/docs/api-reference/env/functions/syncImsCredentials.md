# `syncImsCredentials()`

```ts
function syncImsCredentials(cwd?: string): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages-private/scripting-utils/source/env.ts#L138)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Parameters

| Parameter | Type     | Description                                                                |
| --------- | -------- | -------------------------------------------------------------------------- |
| `cwd`     | `string` | A directory within the project. Defaults to the current working directory. |

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
