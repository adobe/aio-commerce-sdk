# `getProjectInstallCommand()`

```ts
function getProjectInstallCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:431](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L431)

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
