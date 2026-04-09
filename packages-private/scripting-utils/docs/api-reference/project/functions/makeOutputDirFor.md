# `makeOutputDirFor()`

```ts
function makeOutputDirFor(fileOrFolder: string): Promise<string>;
```

Defined in: [project.ts:126](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages-private/scripting-utils/source/project.ts#L126)

Create the output directory for the given file or folder (relative to the project root)

## Parameters

| Parameter      | Type     | Description                  |
| -------------- | -------- | ---------------------------- |
| `fileOrFolder` | `string` | The file or folder to create |

## Returns

`Promise`\<`string`\>
