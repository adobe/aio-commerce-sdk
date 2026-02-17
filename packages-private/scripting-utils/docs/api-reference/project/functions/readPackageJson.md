# `readPackageJson()`

```ts
function readPackageJson(cwd?: string): Promise<PackageJson | null>;
```

Defined in: [project.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/scripting-utils/source/project.ts#L81)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`PackageJson` \| `null`\>
