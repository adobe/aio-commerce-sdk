# `loadPackageJson()`

```ts
function loadPackageJson(cwd?: string): Promise<NPMCliPackageJson | null>;
```

Defined in: [project.ts:122](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L122)

Load the nearest package.json file with npmcli's package.json helper.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd?`    | `string` | The current working directory |

## Returns

`Promise`\<`NPMCliPackageJson` \| `null`\>
