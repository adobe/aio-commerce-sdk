# `detectPackageManager()`

```ts
function detectPackageManager(
  projectRoot: string,
): Promise<"npm" | "pnpm" | "yarn" | "bun">;
```

Defined in: [project.ts:336](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L336)

Detect the package manager for a project.

## Parameters

| Parameter     | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `projectRoot` | `string` | Resolved project root containing package-manager metadata. |

## Returns

`Promise`\<`"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`\>
