# `getInstalledPackageVersion()`

```ts
function getInstalledPackageVersion(
  packageName: string,
  cwd?: string,
): Promise<string | null>;
```

Defined in: [project.ts:150](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/project.ts#L150)

Resolve the installed package version from a project root.

## Parameters

| Parameter     | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `packageName` | `string` | Package name to resolve.           |
| `cwd?`        | `string` | Project directory to resolve from. |

## Returns

`Promise`\<`string` \| `null`\>
