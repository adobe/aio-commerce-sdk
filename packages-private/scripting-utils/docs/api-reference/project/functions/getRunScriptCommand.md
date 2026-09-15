# `getRunScriptCommand()`

```ts
function getRunScriptCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
  scriptName: string,
): string;
```

Defined in: [project.ts:373](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L373)

Get the command that runs a package script.

## Parameters

| Parameter        | Type                                       | Description                   |
| ---------------- | ------------------------------------------ | ----------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager. |
| `scriptName`     | `string`                                   | Package script name.          |

## Returns

`string`
