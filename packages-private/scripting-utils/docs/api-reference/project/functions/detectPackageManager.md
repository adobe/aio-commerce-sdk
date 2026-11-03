# `detectPackageManager()`

```ts
function detectPackageManager(
  projectRoot: string,
): Promise<"npm" | "pnpm" | "yarn" | "bun">;
```

Defined in: [project.ts:336](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L336)

Detect the package manager for a project.

## Parameters

| Parameter     | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `projectRoot` | `string` | Resolved project root containing package-manager metadata. |

## Returns

`Promise`\<`"npm"` \| `"pnpm"` \| `"yarn"` \| `"bun"`\>
