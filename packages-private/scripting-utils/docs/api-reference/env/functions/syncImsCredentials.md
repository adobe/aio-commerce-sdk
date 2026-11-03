# `syncImsCredentials()`

```ts
function syncImsCredentials(
  projectRoot: string,
): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:125](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/env.ts#L125)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Parameters

| Parameter     | Type     | Description                                       |
| ------------- | -------- | ------------------------------------------------- |
| `projectRoot` | `string` | Resolved project root containing the `.env` file. |

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
