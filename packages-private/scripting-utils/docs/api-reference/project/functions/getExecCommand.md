# `getExecCommand()`

```ts
function getExecCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): string;
```

Defined in: [project.ts:359](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L359)

Get the exec command that runs a **locally installed** binary from
`node_modules/.bin` for the given package manager.

## Parameters

| Parameter        | Type                                       | Description                  |
| ---------------- | ------------------------------------------ | ---------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager |

## Returns

`string`
