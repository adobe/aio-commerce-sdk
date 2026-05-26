# `replaceEnvVar()`

```ts
function replaceEnvVar(filePath: string, key: string, value: string): void;
```

Defined in: [env.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/scripting-utils/source/env.ts#L53)

Replaces or creates an environment variable in a .env file

## Parameters

| Parameter  | Type     | Description                                       |
| ---------- | -------- | ------------------------------------------------- |
| `filePath` | `string` | The path to the .env file                         |
| `key`      | `string` | The environment variable key to replace or create |
| `value`    | `string` | The new value for the environment variable        |

## Returns

`void`
