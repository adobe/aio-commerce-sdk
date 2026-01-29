# `makeOutputDirFor()`

```ts
function makeOutputDirFor(fileOrFolder: string): Promise<string>;
```

Defined in: [project.ts:126](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages-private/scripting-utils/source/project.ts#L126)

Create the output directory for the given file or folder (relative to the project root)

## Parameters

| Parameter      | Type     | Description                  |
| -------------- | -------- | ---------------------------- |
| `fileOrFolder` | `string` | The file or folder to create |

## Returns

`Promise`\<`string`\>
