# `getInstalledPackageVersion()`

```ts
function getInstalledPackageVersion(
  packageName: string,
  cwd?: string,
): Promise<string | null>;
```

Defined in: [project.ts:150](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L150)

Resolve the installed package version from a project root.

## Parameters

| Parameter     | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `packageName` | `string` | Package name to resolve.           |
| `cwd`         | `string` | Project directory to resolve from. |

## Returns

`Promise`\<`string` \| `null`\>
