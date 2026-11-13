# `findNearestPackageJson()`

```ts
function findNearestPackageJson(cwd?: string): Promise<string | null>;
```

Defined in: [project.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/project.ts#L93)

Find the nearest package.json file in the current working directory or its parents

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd?`    | `string` | The current working directory |

## Returns

`Promise`\<`string` \| `null`\>
