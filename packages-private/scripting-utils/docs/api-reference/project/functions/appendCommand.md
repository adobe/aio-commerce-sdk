# `appendCommand()`

```ts
function appendCommand(
  existingCommand: string | undefined,
  command: string,
): string;
```

Defined in: [project.ts:302](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/scripting-utils/source/project.ts#L302)

Append a command to an existing `&&` command chain without duplicating it.

## Parameters

| Parameter         | Type                    | Description             |
| ----------------- | ----------------------- | ----------------------- |
| `existingCommand` | `string` \| `undefined` | Existing command chain. |
| `command`         | `string`                | Command to append.      |

## Returns

`string`
