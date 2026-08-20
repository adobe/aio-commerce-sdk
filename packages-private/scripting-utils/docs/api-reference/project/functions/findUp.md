# `findUp()`

```ts
function findUp(
  name: string | string[],
  options?: {
    cwd?: string;
    stopAt?: string;
  },
): Promise<string | undefined>;
```

Defined in: [project.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/scripting-utils/source/project.ts#L55)

Find a file by walking up parent directories

## Parameters

| Parameter         | Type                                         | Description                                          |
| ----------------- | -------------------------------------------- | ---------------------------------------------------- |
| `name`            | `string` \| `string`[]                       | The file name to search for (or array of file names) |
| `options`         | \{ `cwd?`: `string`; `stopAt?`: `string`; \} | Search options                                       |
| `options.cwd?`    | `string`                                     | -                                                    |
| `options.stopAt?` | `string`                                     | -                                                    |

## Returns

`Promise`\<`string` \| `undefined`\>

The path to the file, or undefined if not found
