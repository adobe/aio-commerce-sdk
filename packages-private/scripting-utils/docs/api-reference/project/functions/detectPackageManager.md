# `detectPackageManager()`

```ts
function detectPackageManager(
  cwd?: string,
): Promise<"npm" | "pnpm" | "yarn" | "bun">;
```

Defined in: [project.ts:333](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages-private/scripting-utils/source/project.ts#L333)

Detect the package manager for a project.

## Parameters

| Parameter | Type     | Description                                                    |
| --------- | -------- | -------------------------------------------------------------- |
| `cwd`     | `string` | Directory to start detection from; defaults to `process.cwd()` |

## Returns

`Promise`\<`"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`\>
