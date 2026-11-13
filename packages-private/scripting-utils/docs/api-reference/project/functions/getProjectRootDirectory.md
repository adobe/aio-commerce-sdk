# `getProjectRootDirectory()`

```ts
function getProjectRootDirectory(cwd?: string): Promise<string>;
```

Defined in: [project.ts:260](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/project.ts#L260)

Finds the project root from the nearest ancestor package.json.

## Parameters

| Parameter | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| `cwd?`    | `string` | Directory from which to search upward. |

## Returns

`Promise`\<`string`\>
