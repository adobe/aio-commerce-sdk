# `getRunScriptCommand()`

```ts
function getRunScriptCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
  scriptName: string,
): string;
```

Defined in: [project.ts:371](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/scripting-utils/source/project.ts#L371)

Get the command that runs a package script.

## Parameters

| Parameter        | Type                                       | Description                   |
| ---------------- | ------------------------------------------ | ----------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager. |
| `scriptName`     | `string`                                   | Package script name.          |

## Returns

`string`
