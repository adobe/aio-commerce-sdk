# `getInstalledPackageVersion()`

```ts
function getInstalledPackageVersion(
  packageName: string,
  cwd?: string,
): Promise<string | null>;
```

Defined in: [project.ts:150](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/scripting-utils/source/project.ts#L150)

Resolve the installed package version from a project root.

## Parameters

| Parameter     | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `packageName` | `string` | Package name to resolve.           |
| `cwd`         | `string` | Project directory to resolve from. |

## Returns

`Promise`\<`string` \| `null`\>
