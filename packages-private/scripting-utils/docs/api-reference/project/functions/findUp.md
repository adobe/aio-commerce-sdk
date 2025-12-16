# `findUp()`

```ts
function findUp(
  name: string | string[],
  options: {
    cwd?: string;
    stopAt?: string;
  },
): Promise<undefined | string>;
```

Defined in: [project.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages-private/scripting-utils/source/project.ts#L30)

Find a file by walking up parent directories

## Parameters

| Parameter         | Type                                         | Description                                          |
| ----------------- | -------------------------------------------- | ---------------------------------------------------- |
| `name`            | `string` \| `string`[]                       | The file name to search for (or array of file names) |
| `options`         | \{ `cwd?`: `string`; `stopAt?`: `string`; \} | Search options                                       |
| `options.cwd?`    | `string`                                     | -                                                    |
| `options.stopAt?` | `string`                                     | -                                                    |

## Returns

`Promise`\<`undefined` \| `string`\>

The path to the file, or undefined if not found
