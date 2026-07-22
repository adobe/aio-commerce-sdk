# `detectPackageManager()`

```ts
function detectPackageManager(
  cwd?: string,
): Promise<"npm" | "pnpm" | "yarn" | "bun">;
```

Defined in: [project.ts:314](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/scripting-utils/source/project.ts#L314)

Detect the package manager for a project.

## Parameters

| Parameter | Type     | Description                                                    |
| --------- | -------- | -------------------------------------------------------------- |
| `cwd`     | `string` | Directory to start detection from; defaults to `process.cwd()` |

## Returns

`Promise`\<`"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`\>
