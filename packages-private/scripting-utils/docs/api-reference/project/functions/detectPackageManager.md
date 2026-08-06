# `detectPackageManager()`

```ts
function detectPackageManager(
  cwd?: string,
): Promise<"npm" | "pnpm" | "yarn" | "bun">;
```

Defined in: [project.ts:333](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L333)

Detect the package manager for a project.

## Parameters

| Parameter | Type     | Description                                                    |
| --------- | -------- | -------------------------------------------------------------- |
| `cwd`     | `string` | Directory to start detection from; defaults to `process.cwd()` |

## Returns

`Promise`\<`"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`\>
