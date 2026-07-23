# `getProjectInstallCommand()`

```ts
function getProjectInstallCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:374](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/scripting-utils/source/project.ts#L374)

Get the command that installs a project's declared dependencies.

## Parameters

| Parameter        | Type                                       | Description                  |
| ---------------- | ------------------------------------------ | ---------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager |

## Returns

```ts
{
  args: string[];
  command: string;
}
```

### args

```ts
args: string[];
```

### command

```ts
command: string;
```
