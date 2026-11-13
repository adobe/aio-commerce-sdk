# `appendCommand()`

```ts
function appendCommand(
  existingCommand: string | undefined,
  command: string,
): string;
```

Defined in: [project.ts:305](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/project.ts#L305)

Append a command to an existing `&&` command chain without duplicating it.

## Parameters

| Parameter         | Type                    | Description             |
| ----------------- | ----------------------- | ----------------------- |
| `existingCommand` | `string` \| `undefined` | Existing command chain. |
| `command`         | `string`                | Command to append.      |

## Returns

`string`
