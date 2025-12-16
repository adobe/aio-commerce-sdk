# `readPackageJson()`

```ts
function readPackageJson(cwd: string): Promise<null | PackageJson>;
```

Defined in: [project.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages-private/scripting-utils/source/project.ts#L81)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`null` \| `PackageJson`\>
