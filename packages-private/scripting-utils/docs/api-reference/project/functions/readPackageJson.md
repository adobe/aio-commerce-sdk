# `readPackageJson()`

```ts
function readPackageJson(cwd: string): Promise<null | PackageJson>;
```

Defined in: [project.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages-private/scripting-utils/source/project.ts#L81)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`null` \| `PackageJson`\>
