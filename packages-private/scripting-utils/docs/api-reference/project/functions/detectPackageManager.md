# `detectPackageManager()`

```ts
function detectPackageManager(cwd: string): Promise<PackageManager>;
```

Defined in: [project.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages-private/scripting-utils/source/project.ts#L141)

Detect the package manager by checking for lock files

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `cwd`     | `string` |

## Returns

`Promise`\<[`PackageManager`](../type-aliases/PackageManager.md)\>
