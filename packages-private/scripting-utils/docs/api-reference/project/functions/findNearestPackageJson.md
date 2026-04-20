# `findNearestPackageJson()`

```ts
function findNearestPackageJson(cwd?: string): Promise<string | null>;
```

Defined in: [project.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages-private/scripting-utils/source/project.ts#L67)

Find the nearest package.json file in the current working directory or its parents

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`string` \| `null`\>
