# `makeOutputDirFor()`

```ts
function makeOutputDirFor(
  fileOrFolder: string,
  projectRoot: string,
): Promise<string>;
```

Defined in: [project.ts:276](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/project.ts#L276)

Creates an output directory relative to the project root.

## Parameters

| Parameter      | Type     | Description                           |
| -------------- | -------- | ------------------------------------- |
| `fileOrFolder` | `string` | Project-relative directory to create. |
| `projectRoot`  | `string` | Resolved project root.                |

## Returns

`Promise`\<`string`\>
