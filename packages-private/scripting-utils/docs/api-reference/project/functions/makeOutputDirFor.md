# `makeOutputDirFor()`

```ts
function makeOutputDirFor(fileOrFolder: string): Promise<string>;
```

Defined in: [project.ts:126](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/scripting-utils/source/project.ts#L126)

Create the output directory for the given file or folder (relative to the project root)

## Parameters

| Parameter      | Type     | Description                  |
| -------------- | -------- | ---------------------------- |
| `fileOrFolder` | `string` | The file or folder to create |

## Returns

`Promise`\<`string`\>
