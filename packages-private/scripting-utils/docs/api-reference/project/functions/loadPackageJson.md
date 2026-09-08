# `loadPackageJson()`

```ts
function loadPackageJson(cwd?: string): Promise<NPMCliPackageJson | null>;
```

Defined in: [project.ts:122](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages-private/scripting-utils/source/project.ts#L122)

Load the nearest package.json file with npmcli's package.json helper.

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`NPMCliPackageJson` \| `null`\>
