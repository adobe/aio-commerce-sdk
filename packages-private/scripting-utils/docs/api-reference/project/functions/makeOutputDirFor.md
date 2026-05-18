# `makeOutputDirFor()`

```ts
function makeOutputDirFor(fileOrFolder: string): Promise<string>;
```

Defined in: [project.ts:129](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/scripting-utils/source/project.ts#L129)

Create the output directory for the given file or folder (relative to the project root)

## Parameters

| Parameter      | Type     | Description                  |
| -------------- | -------- | ---------------------------- |
| `fileOrFolder` | `string` | The file or folder to create |

## Returns

`Promise`\<`string`\>
