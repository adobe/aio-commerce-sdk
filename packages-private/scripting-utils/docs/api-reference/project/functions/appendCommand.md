# `appendCommand()`

```ts
function appendCommand(
  existingCommand: string | undefined,
  command: string,
): string;
```

Defined in: [project.ts:305](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L305)

Append a command to an existing `&&` command chain without duplicating it.

## Parameters

| Parameter         | Type                    | Description             |
| ----------------- | ----------------------- | ----------------------- |
| `existingCommand` | `string` \| `undefined` | Existing command chain. |
| `command`         | `string`                | Command to append.      |

## Returns

`string`
