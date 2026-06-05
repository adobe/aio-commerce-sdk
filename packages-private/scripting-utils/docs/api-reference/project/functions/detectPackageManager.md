# `detectPackageManager()`

```ts
function detectPackageManager(
  cwd?: string,
): Promise<"npm" | "pnpm" | "yarn" | "bun">;
```

Defined in: [project.ts:163](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages-private/scripting-utils/source/project.ts#L163)

Detect the package manager for a project.

## Parameters

| Parameter | Type     | Description                                                    |
| --------- | -------- | -------------------------------------------------------------- |
| `cwd`     | `string` | Directory to start detection from; defaults to `process.cwd()` |

## Returns

`Promise`\<`"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`\>
