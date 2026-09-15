# `getProjectRootDirectory()`

```ts
function getProjectRootDirectory(cwd?: string): Promise<string>;
```

Defined in: [project.ts:260](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L260)

Finds the project root from the nearest ancestor package.json.

## Parameters

| Parameter | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| `cwd`     | `string` | Directory from which to search upward. |

## Returns

`Promise`\<`string`\>
