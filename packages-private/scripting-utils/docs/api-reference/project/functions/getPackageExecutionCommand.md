# `getPackageExecutionCommand()`

```ts
function getPackageExecutionCommand(
  packageManager: "npm" | "pnpm" | "yarn" | "bun",
  args: string[],
  options?: {
    allowBuild?: string;
  },
): {
  args: string[];
  command: string;
};
```

Defined in: [project.ts:385](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages-private/scripting-utils/source/project.ts#L385)

Get the command that executes a package without adding it to the project.

## Parameters

| Parameter             | Type                                       | Description                                             |
| --------------------- | ------------------------------------------ | ------------------------------------------------------- |
| `packageManager`      | `"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"` | The detected package manager.                           |
| `args`                | `string`[]                                 | Package specifier followed by arguments for its binary. |
| `options`             | \{ `allowBuild?`: `string`; \}             | Package execution options.                              |
| `options.allowBuild?` | `string`                                   | Package whose build script pnpm may execute.            |

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
