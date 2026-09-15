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

Defined in: [project.ts:387](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L387)

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
