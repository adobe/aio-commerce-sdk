# `getProjectInstallCommand()`

```ts
function getProjectInstallCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:374](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages-private/scripting-utils/source/project.ts#L374)

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
