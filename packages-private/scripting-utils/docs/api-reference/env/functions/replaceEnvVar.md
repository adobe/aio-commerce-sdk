# `replaceEnvVar()`

```ts
function replaceEnvVar(filePath: string, key: string, value: string): void;
```

Defined in: [env.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/scripting-utils/source/env.ts#L55)

Replaces or creates an environment variable in a .env file

## Parameters

| Parameter  | Type     | Description                                       |
| ---------- | -------- | ------------------------------------------------- |
| `filePath` | `string` | The path to the .env file                         |
| `key`      | `string` | The environment variable key to replace or create |
| `value`    | `string` | The new value for the environment variable        |

## Returns

`void`
