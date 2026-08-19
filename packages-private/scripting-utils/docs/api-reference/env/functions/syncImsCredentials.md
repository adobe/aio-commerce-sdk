# `syncImsCredentials()`

```ts
function syncImsCredentials(cwd?: string): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/scripting-utils/source/env.ts#L138)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Parameters

| Parameter | Type     | Description                                                                |
| --------- | -------- | -------------------------------------------------------------------------- |
| `cwd`     | `string` | A directory within the project. Defaults to the current working directory. |

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
