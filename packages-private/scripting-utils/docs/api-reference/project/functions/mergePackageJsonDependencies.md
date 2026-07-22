# `mergePackageJsonDependencies()`

```ts
function mergePackageJsonDependencies(
  dependencies: PackageJsonDependencies,
  requiredDependencies: readonly PackageDependency[],
  dependencyMaps?: readonly Partial<Record<string, string>>[],
): WritablePackageJsonDependencies;
```

Defined in: [project.ts:225](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/scripting-utils/source/project.ts#L225)

Merge required dependencies into a package.json dependency map when they are missing.

## Parameters

| Parameter              | Type                                                                   | Description                                 |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| `dependencies`         | `PackageJsonDependencies`                                              | Dependency map to update.                   |
| `requiredDependencies` | readonly [`PackageDependency`](../type-aliases/PackageDependency.md)[] | Dependencies that should exist.             |
| `dependencyMaps`       | readonly `Partial`\<`Record`\<`string`, `string`\>\>[]                 | Package dependency maps to compare against. |

## Returns

`WritablePackageJsonDependencies`
