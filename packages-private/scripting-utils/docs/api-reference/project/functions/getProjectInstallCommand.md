# `getProjectInstallCommand()`

```ts
function getProjectInstallCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:433](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L433)

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
