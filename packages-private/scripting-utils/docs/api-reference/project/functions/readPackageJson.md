# `readPackageJson()`

```ts
function readPackageJson(cwd?: string): Promise<PackageJson | null>;
```

Defined in: [project.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages-private/scripting-utils/source/project.ts#L84)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`PackageJson` \| `null`\>
