# `getInstallCommand()`

```ts
function getInstallCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
  packages: string[],
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:202](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages-private/scripting-utils/source/project.ts#L202)

Get the command to install the given dependencies with the given package
manager (e.g. `pnpm add foo bar`, `npm i foo bar`).

## Parameters

| Parameter        | Type                                       | Description                                         |
| ---------------- | ------------------------------------------ | --------------------------------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager                        |
| `packages`       | `string`[]                                 | Package specifiers to install (e.g. `["foo@^1.0"]`) |

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
