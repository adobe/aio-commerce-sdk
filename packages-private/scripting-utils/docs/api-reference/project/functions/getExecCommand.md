# `getExecCommand()`

```ts
function getExecCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): string;
```

Defined in: [project.ts:187](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/scripting-utils/source/project.ts#L187)

Get the exec command that runs a **locally installed** binary from
`node_modules/.bin` for the given package manager.

## Parameters

| Parameter        | Type                                       | Description                  |
| ---------------- | ------------------------------------------ | ---------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager |

## Returns

`string`
