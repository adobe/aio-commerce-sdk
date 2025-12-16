# `findNearestPackageJson()`

```ts
function findNearestPackageJson(cwd: string): Promise<null | string>;
```

Defined in: [project.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages-private/scripting-utils/source/project.ts#L67)

Find the nearest package.json file in the current working directory or its parents

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`null` \| `string`\>
