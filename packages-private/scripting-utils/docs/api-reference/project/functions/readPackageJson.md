# `readPackageJson()`

```ts
function readPackageJson(cwd?: string): Promise<PackageJson | null>;
```

Defined in: [project.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/scripting-utils/source/project.ts#L81)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`PackageJson` \| `null`\>
