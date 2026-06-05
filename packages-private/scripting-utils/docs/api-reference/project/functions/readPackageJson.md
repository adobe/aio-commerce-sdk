# `readPackageJson()`

```ts
function readPackageJson(cwd?: string): Promise<PackageJson | null>;
```

Defined in: [project.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages-private/scripting-utils/source/project.ts#L84)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`PackageJson` \| `null`\>
