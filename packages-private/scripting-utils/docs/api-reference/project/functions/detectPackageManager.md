# `detectPackageManager()`

```ts
function detectPackageManager(cwd?: string): Promise<PackageManager>;
```

Defined in: [project.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/scripting-utils/source/project.ts#L141)

Detect the package manager by checking for lock files

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `cwd`     | `string` |

## Returns

`Promise`\<[`PackageManager`](../type-aliases/PackageManager.md)\>
