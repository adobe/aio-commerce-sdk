# `readPackageJson()`

```ts
function readPackageJson(cwd: string): Promise<PackageJson | null>;
```

Defined in: [project.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages-private/scripting-utils/source/project.ts#L81)

Read the package.json file

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`PackageJson` \| `null`\>
