# `findUp()`

```ts
function findUp(
  name: string | string[],
  options: {
    cwd?: string;
    stopAt?: string;
  },
): Promise<string | undefined>;
```

Defined in: [project.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages-private/scripting-utils/source/project.ts#L30)

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
