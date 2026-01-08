# `findNearestPackageJson()`

```ts
function findNearestPackageJson(cwd: string): Promise<null | string>;
```

Defined in: [project.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages-private/scripting-utils/source/project.ts#L67)

Find the nearest package.json file in the current working directory or its parents

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`null` \| `string`\>
