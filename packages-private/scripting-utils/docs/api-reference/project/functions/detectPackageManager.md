# `detectPackageManager()`

```ts
function detectPackageManager(cwd?: string): Promise<PackageManager>;
```

Defined in: [project.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/scripting-utils/source/project.ts#L141)

Detect the package manager by checking for lock files

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `cwd`     | `string` |

## Returns

`Promise`\<[`PackageManager`](../type-aliases/PackageManager.md)\>
