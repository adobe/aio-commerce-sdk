# `getInstallCommand()`

```ts
function getInstallCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
  packages: string[],
  options?: PackageInstallOptions,
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:413](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L413)

Get the command to install the given dependencies with the given package
manager (e.g. `pnpm add foo bar`, `npm i foo bar`).

## Parameters

| Parameter        | Type                                                                | Description                                         |
| ---------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| `packageManager` | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`                          | The detected package manager                        |
| `packages`       | `string`[]                                                          | Package specifiers to install (e.g. `["foo@^1.0"]`) |
| `options?`       | [`PackageInstallOptions`](../type-aliases/PackageInstallOptions.md) | Install command options.                            |

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
