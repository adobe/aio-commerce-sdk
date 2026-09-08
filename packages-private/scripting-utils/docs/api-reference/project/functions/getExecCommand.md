# `getExecCommand()`

```ts
function getExecCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): string;
```

Defined in: [project.ts:357](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages-private/scripting-utils/source/project.ts#L357)

Get the exec command that runs a **locally installed** binary from
`node_modules/.bin` for the given package manager.

## Parameters

| Parameter        | Type                                       | Description                  |
| ---------------- | ------------------------------------------ | ---------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager |

## Returns

`string`
