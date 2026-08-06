# `getRunScriptCommand()`

```ts
function getRunScriptCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
  scriptName: string,
): string;
```

Defined in: [project.ts:371](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L371)

Get the command that runs a package script.

## Parameters

| Parameter        | Type                                       | Description                   |
| ---------------- | ------------------------------------------ | ----------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager. |
| `scriptName`     | `string`                                   | Package script name.          |

## Returns

`string`
