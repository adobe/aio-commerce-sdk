# `appendCommand()`

```ts
function appendCommand(
  existingCommand: string | undefined,
  command: string,
): string;
```

Defined in: [project.ts:302](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages-private/scripting-utils/source/project.ts#L302)

Append a command to an existing `&&` command chain without duplicating it.

## Parameters

| Parameter         | Type                    | Description             |
| ----------------- | ----------------------- | ----------------------- |
| `existingCommand` | `string` \| `undefined` | Existing command chain. |
| `command`         | `string`                | Command to append.      |

## Returns

`string`
