# `findNearestPackageJson()`

```ts
function findNearestPackageJson(cwd?: string): Promise<string | null>;
```

Defined in: [project.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/scripting-utils/source/project.ts#L67)

Find the nearest package.json file in the current working directory or its parents

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`string` \| `null`\>
