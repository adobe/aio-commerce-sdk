# `syncImsCredentials()`

```ts
function syncImsCredentials(
  projectRoot: string,
): Promise<SyncImsCredentialsResult>;
```

Defined in: [env.ts:125](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/env.ts#L125)

Syncs the IMS credentials environment variables from the configured IMS context in
the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.

## Parameters

| Parameter     | Type     | Description                                       |
| ------------- | -------- | ------------------------------------------------- |
| `projectRoot` | `string` | Resolved project root containing the `.env` file. |

## Returns

`Promise`\<[`SyncImsCredentialsResult`](../type-aliases/SyncImsCredentialsResult.md)\>
