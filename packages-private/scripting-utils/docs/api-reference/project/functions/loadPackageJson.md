# `loadPackageJson()`

```ts
function loadPackageJson(cwd?: string): Promise<NPMCliPackageJson | null>;
```

Defined in: [project.ts:122](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/project.ts#L122)

Load the nearest package.json file with npmcli's package.json helper.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd?`    | `string` | The current working directory |

## Returns

`Promise`\<`NPMCliPackageJson` \| `null`\>
