# `makeOutputDirFor()`

```ts
function makeOutputDirFor(
  fileOrFolder: string,
  projectRoot: string,
): Promise<string>;
```

Defined in: [project.ts:276](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L276)

Creates an output directory relative to the project root.

## Parameters

| Parameter      | Type     | Description                           |
| -------------- | -------- | ------------------------------------- |
| `fileOrFolder` | `string` | Project-relative directory to create. |
| `projectRoot`  | `string` | Resolved project root.                |

## Returns

`Promise`\<`string`\>
