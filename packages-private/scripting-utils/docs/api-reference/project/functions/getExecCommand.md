# `getExecCommand()`

```ts
function getExecCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): string;
```

Defined in: [project.ts:357](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L357)

Get the exec command that runs a **locally installed** binary from
`node_modules/.bin` for the given package manager.

## Parameters

| Parameter        | Type                                       | Description                  |
| ---------------- | ------------------------------------------ | ---------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager |

## Returns

`string`
