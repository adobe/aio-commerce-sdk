# `detectPackageManager()`

```ts
function detectPackageManager(cwd: string): Promise<PackageManager>;
```

Defined in: [project.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages-private/scripting-utils/source/project.ts#L141)

Detect the package manager by checking for lock files

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `cwd`     | `string` |

## Returns

`Promise`\<[`PackageManager`](../type-aliases/PackageManager.md)\>
