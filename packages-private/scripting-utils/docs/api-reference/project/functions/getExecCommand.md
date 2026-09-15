# `getExecCommand()`

```ts
function getExecCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): string;
```

Defined in: [project.ts:359](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L359)

Get the exec command that runs a **locally installed** binary from
`node_modules/.bin` for the given package manager.

## Parameters

| Parameter        | Type                                       | Description                  |
| ---------------- | ------------------------------------------ | ---------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager |

## Returns

`string`
