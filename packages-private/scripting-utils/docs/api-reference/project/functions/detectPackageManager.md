# `detectPackageManager()`

```ts
function detectPackageManager(cwd: string): Promise<PackageManager>;
```

Defined in: [project.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages-private/scripting-utils/source/project.ts#L141)

Detect the package manager by checking for lock files

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `cwd`     | `string` |

## Returns

`Promise`\<[`PackageManager`](../type-aliases/PackageManager.md)\>
