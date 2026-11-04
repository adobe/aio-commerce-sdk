# `makeOutputDirFor()`

```ts
function makeOutputDirFor(
  fileOrFolder: string,
  projectRoot: string,
): Promise<string>;
```

Defined in: [project.ts:276](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L276)

Creates an output directory relative to the project root.

## Parameters

| Parameter      | Type     | Description                           |
| -------------- | -------- | ------------------------------------- |
| `fileOrFolder` | `string` | Project-relative directory to create. |
| `projectRoot`  | `string` | Resolved project root.                |

## Returns

`Promise`\<`string`\>
